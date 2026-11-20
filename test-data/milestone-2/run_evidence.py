"""Real local Flask endpoint runs and prompt experiments; synthetic data only."""
import ast
import io
import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
os.environ['AI_PROVIDER'] = 'ollama'
os.environ['OLLAMA_TIMEOUT_SECONDS'] = '55'
import app
from model_runtime import OllamaClient
from reportlab.pdfgen import canvas

OUT = ROOT / 'test-data/milestone-2'
MODEL = 'qwen3.5:4b'
BASE = '''Alex Example
alex@example.com
Summary
Junior software developer with Python, SQL and React project experience.
Experience
Example Labs | Software Intern | 2025
Built a Flask API and reduced response time by 30% through query optimization.
Projects
Campus Dashboard | React, Python, SQL
Built an accessible dashboard with automated tests.
Education
Example University | BTech Computer Science | 2026
Skills
Python, SQL, React, Flask, Git, automated testing
'''
JD = 'We seek a junior software developer with Python, SQL, React and Flask experience to build accessible dashboards, design REST APIs, write automated tests, collaborate with engineers and optimize database performance.'
OTHER = 'We seek a graphic designer experienced in typography, illustration, Adobe Photoshop, Illustrator, branding, visual identity, print layouts and client communication to create marketing campaigns and editorial artwork for clients.'

def pdf_bytes(text=None):
    stream = io.BytesIO()
    c = canvas.Canvas(stream)
    if text:
        for i, line in enumerate(text.splitlines()): c.drawString(35, 800-i*16, line)
    c.showPage(); c.save()
    return stream.getvalue()

cases = [
 ('T01','Normal','/analyze',{'resume_text':BASE,'job_description':JD},'200; bounded score and nonempty AI feedback','analysis'),
 ('T02','Normal','/analyze',{'resume_text':BASE.replace('Alex Example','Jordan Example'),'job_description':OTHER},'200; bounded score and nonempty AI feedback for unrelated role','analysis'),
 ('T03','Normal','/parse-resume',{'resume_text':BASE.replace('Alex Example','Sam Example')},'200; preserve Sam Example and the supplied 30% metric','parse'),
 ('T04','Normal','/skills-analysis',{'resume_text':BASE.replace('Alex Example','Taylor Example'),'job_description':JD},'200; technical, soft and domain categories with bounded scores','skills'),
 ('T05','Normal','/cover-letter',{'resume_text':BASE.replace('Alex Example','Robin Example'),'job_description':JD,'tone':'concise'},'200; nonempty cover letter of at most 150 words','letter'),
 ('T06','Normal','/chat',{'resume_text':BASE.replace('Alex Example','Casey Example'),'job_description':JD,'message':'Rewrite the Flask API bullet using only the supplied achievement.','history':'[]'},'200; response preserves the supplied 30% achievement','chat'),
 ('T07','Edge','/analyze',{'resume_text':BASE.replace('Alex Example','Morgan Example'),'job_description':''},'200; general audit with bounded score and AI feedback','analysis'),
 ('T08','Edge','/analyze',{'resume_text':'Lee Example\nPython SQL Flask React Git\nBuilt a dashboard and tested REST APIs.','job_description':JD},'200; handle resume without standard section headings','analysis'),
 ('T09','Edge','/analyze',{'resume_text':BASE.replace('Alex Example','Avery Example'),'job_description':JD,'role_level':'unsupported-tier','years_experience':'-5'},'200; normalize unknown role and negative experience safely','analysis'),
 ('T10','Edge','/analyze',{'resume_text':'Boundary Example\nSkills\nPython SQL Flask\n'+' project'*3744,'job_description':''},'200; accept a resume near but below the 30000-character limit','analysis'),
 ('T11','Edge','/analyze',{'file_kind':'blank_pdf','job_description':JD},'400; explain missing extractable text and OCR/paste alternative','ocr'),
 ('T12','Invalid','/analyze',{'resume_text':'','job_description':JD},'400; missing-resume error','missing'),
 ('T13','Invalid','/analyze',{'resume_text':BASE,'job_description':'Python SQL developer'},'400; reject job description shorter than 20 words','short'),
 ('T14','Invalid','/analyze',{'file_kind':'text_file','job_description':JD},'400; reject unsupported .txt upload','file'),
 ('T15','Invalid','/analyze',{'file_kind':'corrupt_pdf','job_description':JD},'400; reject corrupt PDF','corrupt'),
 ('T16','Invalid','/analyze',{'resume_text':'Oversize Example\n'+'x'*30001,'job_description':JD},'400; reject resume exceeding 30000 characters','oversize'),
]


def check(kind,status,b):
    if kind=='analysis': return status==200 and isinstance(b.get('score'),(int,float)) and 0<=b['score']<=100 and b.get('ai_recommendations',{}).get('status')=='ok' and bool(b.get('ai_recommendations',{}).get('strengths') or b.get('ai_recommendations',{}).get('weak_points'))
    if kind=='parse': return status==200 and b.get('personal_info',{}).get('name')=='Sam Example' and '30%' in json.dumps(b.get('experience',[]))
    if kind=='skills': return status==200 and all(isinstance(b.get(k),dict) and isinstance(b[k].get('score'),(int,float)) and 0<=b[k]['score']<=100 and isinstance(b[k].get('skills'),list) for k in ['technical','soft','domain'])
    if kind=='letter': return status==200 and 0<len(b.get('cover_letter','').split())<=150
    if kind=='chat': return status==200 and '30%' in b.get('reply','')
    error=b.get('error','').lower()
    needles={'ocr':['ocr','paste'],'missing':['missing'],'short':['20','short'],'file':['pdf'],'corrupt':['pdf'],'oversize':['30,000']}
    return status==400 and all(s in error for s in needles[kind])


def save_json(path,data): path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')


def run_tests():
    results=[]; client=app.app.test_client()
    for ident,typ,route,fields,expected,kind in cases:
        fields=dict(fields)
        recorded=dict(fields)
        filespec=fields.pop('file_kind',None)
        if filespec:
            raw = pdf_bytes() if filespec=='blank_pdf' else b'this is deliberately not a PDF'
            filename='blank.pdf' if filespec=='blank_pdf' else ('resume.txt' if filespec=='text_file' else 'corrupt.pdf')
            (OUT/filename).write_bytes(raw)
            fields['resume']=(io.BytesIO(raw),filename)
            recorded['fixture_file']=filename
            recorded['sha256']=hashlib.sha256(raw).hexdigest()
        start=time.perf_counter()
        try:
            response=client.post(route,data=fields)
            body=response.get_json() or {'raw':response.get_data(as_text=True)}
            status=response.status_code
            passed=check(kind,status,body)
        except Exception as e:
            status=None;body={'runner_error':str(e)};passed=False
        item={'id':ident,'type':typ,'route':route,'input':recorded,'expected':expected,'http_status':status,'actual_output':body,'result':'Pass' if passed else 'Fail','seconds':round(time.perf_counter()-start,2),'timestamp_utc':datetime.now(timezone.utc).isoformat()}
        results.append(item);save_json(OUT/f'{ident}.json',item);save_json(OUT/'results.json',results)
        print(ident,item['result'],status,item['seconds'],flush=True)
    return results


def production_templates():
    tree=ast.parse((ROOT/'backend/app.py').read_text())
    templates={}
    names={'get_ai_recommendations':['P1_general_audit','P2_job_match'],'generate_cover_letter':['P3_cover_letter'],'skills_analysis':['P4_skills'],'chat':['P5_chat'],'parse_resume':['P6_parse_resume']}
    # Use actual function names from route decorators where names vary.
    for func in tree.body:
        if not isinstance(func,ast.FunctionDef):continue
        routes=[d.args[0].value for d in func.decorator_list if isinstance(d,ast.Call) and isinstance(d.func,ast.Attribute) and d.func.attr=='route' and d.args and isinstance(d.args[0],ast.Constant)]
        ids=names.get(func.name)
        if not ids and routes:
            ids={'/skills-analysis':['P4_skills'],'/chat':['P5_chat']}.get(routes[0])
        if not ids:continue
        nodes=[n for n in ast.walk(func) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='prompt' for t in n.targets)]
        nodes.sort(key=lambda n:n.lineno)
        suffix=''
        for n in ast.walk(func):
            if isinstance(n,ast.AugAssign) and isinstance(n.target,ast.Name) and n.target.id=='prompt' and isinstance(n.value,ast.Constant): suffix+=n.value.value
        for ident,node in zip(ids,nodes):
            expr=node.value
            text=''
            for v in expr.values:
                text += v.value if isinstance(v,ast.Constant) else '{'+ast.unparse(v.value)+'}'
            templates[ident]=text+suffix
            (ROOT/'prompts/final'/f'{ident}.txt').write_text('\n'.join(line.rstrip() for line in (text+suffix).splitlines())+'\n')
    assert len(templates)==6,templates.keys()
    return templates


def experiments(templates):
    schema='Return ONLY a JSON object with these keys: strengths (array), weak_points (array), rewritten_bullets (array), skills_rewrite (string), summary_rewrite (string), interview_focus (array).'
    data='\nResume:\n{resume}\nJob Description:\n{job}\n'
    versions=[
      ('v1','Re-run the Milestone 1 baseline supplied in the screenshot. This is a new experiment, not a historical run.','Starting point: inspect output structure and factual grounding.', 'Act as a resume reviewer. Compare the given resume with the job description and evaluate how well the candidate fits the role. Identify matching skills, missing skills, and areas for improvement. Suggest better resume bullet points without adding fake skills or experience. Give a match score out of 100 with a short explanation.'+data),
      ('v2','Add the application JSON contract.','Assess whether explicit output fields improve machine-readable consistency.', 'You are an expert resume coach. '+schema+data),
      ('v3','Add factual-grounding and finished-bullet constraints.','Structured output alone does not prevent fabricated achievements or placeholders.', 'You are an expert resume coach. '+schema+' Preserve supplied facts; never invent metrics, skills or achievements. Ask about missing evidence in weak_points. Each rewritten bullet must be finished, at most 40 words and contain no placeholders or questions.'+data),
      ('v4','Use the current application job-match prompt, including seniority and its complete output constraints.','Compare the production prompt with the newly tested alternatives; final selection follows the existing implementation, not a claim it wins every case.',templates['P2_job_match']),
    ]
    results=[];ai=OllamaClient()
    for version,change,why,template in versions:
        (ROOT/'prompts'/version/'P2_job_match.txt').write_text(template)
        prompt=template.replace('{resume}',BASE).replace('{job}',JD).replace('{role_level}','junior').replace('{years_experience}','0')
        start=time.perf_counter(); raw='';error=None
        try: raw=ai.generate_content(model=MODEL,contents=prompt).text
        except Exception as e: error=str(e)
        try: parsed=json.loads(raw); valid=True
        except Exception: parsed={};valid=False
        keys=['strengths','weak_points','rewritten_bullets','skills_rewrite','summary_rewrite','interview_focus']
        schema_ok=valid and isinstance(parsed,dict) and all(k in parsed for k in keys)
        bullets=parsed.get('rewritten_bullets',[]) if isinstance(parsed,dict) else []
        checks={'strict_json':valid,'required_keys_present':schema_ok,'rewritten_bullet_count':len(bullets) if isinstance(bullets,list) else None,'all_bullets_at_most_40_words':bool(isinstance(bullets,list) and bullets) and all(isinstance(b,str) and len(b.split())<=40 for b in bullets)}
        item={'version':version,'change':change,'reason':why,'input':{'resume':BASE,'job':JD,'role_level':'junior','years_experience':0},'rendered_prompt':prompt,'raw_output':raw,'checks':checks,'error':error,'seconds':round(time.perf_counter()-start,2),'timestamp_utc':datetime.now(timezone.utc).isoformat()}
        results.append(item);save_json(OUT/f'prompt-{version}.json',item);save_json(OUT/'prompt-experiments.json',results)
        print('PROMPT',version,checks,item['seconds'],flush=True)
    return results

if __name__=='__main__':
    metadata={'execution':'local Flask test client; real Ollama inference, no mocked AI','model':MODEL,'provider':'ollama','production_provider':'Gemini; these runs do not verify hosted Gemini','settings':{'temperature':0.1,'num_ctx':8192,'num_predict':4096,'think':False},'started_utc':datetime.now(timezone.utc).isoformat(),'source_sha':__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'fixtures':'Entirely synthetic; example.com email; no real student resumes.'}
    save_json(OUT/'run-metadata.json',metadata)
    templates=production_templates();run_tests();experiments(templates)
