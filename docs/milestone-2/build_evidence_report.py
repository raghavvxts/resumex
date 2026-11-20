"""Render saved real runs into Markdown and a PDF appendix; does not run tests."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import landscape, A4

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'test-data/milestone-2'
OUT=ROOT/'docs/milestone-2'
tests=json.loads((DATA/'results.json').read_text())
versions=json.loads((DATA/'prompt-experiments.json').read_text())
meta=json.loads((DATA/'run-metadata.json').read_text())
assert len(tests)==16 and len({t['id'] for t in tests})==16
assert len({json.dumps(t['input'],sort_keys=True) for t in tests})==16
assert len(versions)==4 and len({v['rendered_prompt'] for v in versions})==4
assert all(t['actual_output'] is not None and t['expected'] and t['result'] in ('Pass','Fail') for t in tests)
assert all(v['raw_output'] or v['error'] for v in versions)


def summary(t):
 b=t['actual_output']
 if b.get('error'): return f"HTTP {t['http_status']}: {b['error']}"
 if b.get('runner_error'):return b['runner_error']
 if t['route']=='/analyze':
  ai=b.get('ai_recommendations',{})
  return f"HTTP {t['http_status']}; score {b.get('score')}; AI {ai.get('status')}; "+(ai.get('message') or f"{len(ai.get('strengths',[]))} strengths, {len(ai.get('weak_points',[]))} weak points")
 if t['route']=='/parse-resume':return f"HTTP {t['http_status']}; name {b.get('personal_info',{}).get('name')}; 30% preserved: {'30%' in json.dumps(b.get('experience',[]))}"
 if t['route']=='/cover-letter':return f"HTTP {t['http_status']}; {len(b.get('cover_letter','').split())} words. "+b.get('cover_letter','')[:110]
 if t['route']=='/chat':return f"HTTP {t['http_status']}; "+b.get('reply','')[:190]
 return f"HTTP {t['http_status']}; "+'; '.join(f"{k}: {b.get(k,{}).get('score')}" for k in ['technical','soft','domain'])


def label(t):
 i=t['input']
 if i.get('file_kind'):return i['file_kind']
 text=i.get('resume_text','')
 return (text.splitlines()[0] if text else 'Empty resume')+f"; resume {len(text)} characters; "+ ('no JD' if not i.get('job_description') else 'JD: '+i['job_description'][:64])+ ('; message: '+i['message'][:55] if i.get('message') else '')

passed=sum(t['result']=='Pass' for t in tests)
header=f'''# MatchMyRole - Milestone 2 evidence appendix

Team: Team Tower. Executed 20 November 2026. Source revision: `{meta['source_sha']}`.

**Q17: {len(tests)}. Q18: {len(versions)}.** These counts refer to the records saved alongside this report, not historical development claims.

## Execution and limits

- Real requests through the actual Flask application's test client with real Ollama `{meta['model']}` inference on this computer. No mock AI responses.
- This is local backend/provider verification, not browser end-to-end or production Gemini verification.
- Settings: temperature 0.1, context 8192, maximum output 4096 tokens, thinking disabled; seed not fixed.
- All resume fixtures are synthetic. Complete inputs, actual outputs, timestamps and checks are saved in `test-data/milestone-2/T01.json` through `T16.json`.
- Expected criteria were defined in the runner before execution. Results: {passed} Pass / {len(tests)-passed} Fail. A failure means the stated criterion was unmet; it is retained, not edited into a pass.
- Automated checks cover bounded scores, response contracts, exact fixture facts, length and validation. They do not establish general hiring quality, fairness or complete factual accuracy.

## Test table

| Test | Input (short) | Type | Expected output | Actual output (short) | Pass / Fail |
|---|---|---|---|---|---|
'''
clean=lambda s:str(s).replace('|','/').replace('\n',' ')
lines=[header]
for t in tests:lines.append('| '+' | '.join(map(clean,[t['id'],label(t),t['type'],t['expected'],summary(t),t['result']]))+' |\n')
lines.append('\n## Prompt iteration log\n\nThese are four new experiments performed on 20 November 2026. They are not reconstructed past runs. v1 reuses the user-supplied Milestone 1 baseline; v4 is the current application prompt. All use the same synthetic resume and JD for a controlled comparison, and are not counted again as distinct Q17 inputs. One run per version cannot establish consistency or statistical superiority.\n\n| Version | What changed | Why | Observed result |\n|---|---|---|---|\n')
for v in versions:lines.append('| '+' | '.join(map(clean,[v['version'],v['change'],v['reason'],json.dumps(v['checks'])+'; Grounding review: '+v['manual_grounding_review']['observation']+(('; error: '+v['error']) if v['error'] else '')]))+' |\n')
lines.append('\n## Final prompt inventory\n\nSix templates were extracted from `backend/app.py` (general audit, job match, cover letter, skills, career chat and resume parsing; trailing whitespace trimmed). They are saved in `prompts/final/`. General and job-match audit are mutually exclusive branches of one call, so six templates do not mean six calls on every input. The four-version experiment concerns P2 only.\n\n## Known limitations and next actions\n\n- Local-model results cannot be assumed to match hosted Gemini. Repeat selected cases against the deployed provider.\n- Inspect full generated text manually for unsupported claims; machine checks alone are incomplete.\n- Long input may exceed local context or latency limits even when request validation accepts it.\n- Add the required 2-3 real browser screenshots and team-agreed contributions when assembling the full seven-section Milestone 2 PDF. This appendix is not that full submission.\n\n## Provenance\n\nAI-assisted preparation and execution, at the user\'s request. Team members must review the evidence; no member-specific completed work or consent is inferred. Synthetic test fixtures and runner are published with raw outputs for audit.\n')
(OUT/'EVIDENCE.md').write_text(''.join(lines))

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='CellSmall',fontName='Helvetica',fontSize=7,leading=9))
styles.add(ParagraphStyle(name='SmallBody',fontName='Helvetica',fontSize=9,leading=12,spaceAfter=7))
P=lambda x,style='SmallBody':Paragraph(escape(str(x)).replace('\n','<br/>'),styles[style])
story=[P('MatchMyRole | Team Tower','Title'),P('Milestone 2 - genuine testing and prompt experiment evidence','Heading2'),P(f"20 November 2026 | Q17: {len(tests)} test inputs | Q18: {len(versions)} prompt versions | {passed} Pass / {len(tests)-passed} Fail"),P('Local Flask endpoints with real Ollama qwen3.5:4b. No mock AI. These runs do not verify the hosted Gemini deployment. All fixtures are synthetic. This is an evidence appendix, not the complete seven-section submission.'),P('Test table','Heading2')]
rows=[[P(x,'CellSmall') for x in ['Test','Input (short)','Type','Expected output','Actual output (short)','Result']]]
for t in tests:rows.append([P(x,'CellSmall') for x in [t['id'],label(t),t['type'],t['expected'],summary(t),t['result']]])
t=Table(rows,colWidths=[32,143,40,150,340,40],repeatRows=1,hAlign='LEFT')
t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dfeaf3')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#a9bac6')),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story.append(t)
story += [PageBreak(),P('Prompt iteration log','Heading1'),P('Four newly executed experiments on one controlled synthetic input. v4 matches the existing production prompt; it is not a claim of superior performance. Raw outputs and full prompt text accompany this appendix.')]
for v in versions:
 story += [P(v['version']+' - '+v['change'],'Heading3'),P('Reason: '+v['reason']),P('Observed: '+json.dumps(v['checks'])+f"; {v['seconds']} seconds."+(v['error'] or '')),P('Grounding review: '+v['manual_grounding_review']['observation'])]
story += [P('Limits and reproduction','Heading2'),P('One run per version; no statistical quality claims. Automated checks do not fully validate factual grounding. Complete raw results and runnable code are in test-data/milestone-2/. Full prompts are in prompts/v1/ through v4/ and prompts/final/. See EVIDENCE.md for limitations and reproducibility instructions.'),P('Full prompt versions and actual outputs','Heading1')]
for v in versions:
 story += [PageBreak(),P(v['version']+' - full prompt','Heading2'),P(v['rendered_prompt']),P('Actual model output','Heading2'),P(v['raw_output'] or v['error'])]

def footer(c,doc):
 c.setFont('Helvetica',8);c.drawString(25,16,'Team Tower | Synthetic fixtures | Real local inference | AI-assisted evidence preparation');c.drawRightString(817,16,str(doc.page))
SimpleDocTemplate(str(OUT/'TeamTower_TestAndPromptEvidence.pdf'),pagesize=landscape(A4),leftMargin=25,rightMargin=25,topMargin=25,bottomMargin=30).build(story,onFirstPage=footer,onLaterPages=footer)
print(f'Report: {len(tests)} tests; {len(versions)} versions; {passed} Pass / {len(tests)-passed} Fail')
