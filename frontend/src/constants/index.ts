
export const MIN_JOB_WORDS = 20;

export const COMPANY_TEMPLATES: Record<string, Record<string, string>> = {
  google: {
    swe: "We are looking for a Software Engineer to develop next-generation technologies. Candidates must have experience with Python, C++, Java, distributed systems, algorithms, and data structures. You will design, develop, test, deploy, and maintain software solutions.",
    junior: "Google is looking for a Junior Developer. Requirements: Python, Git version control, basic SQL, algorithms, and collaborative software development. You will write clean code, document APIs, and fix bugs.",
    data_analyst: "Google is seeking a Data Analyst. Required: Python, SQL, Tableau, data visualization, statistical analysis, and machine learning models. You will translate data insights into business actions.",
    pm: "Google is seeking a Product Manager. Required: Technical background in software, API design, user experience design, product strategy, and data analytics. You will define product roadmaps."
  },
  meta: {
    swe: "Meta is looking for a Software Engineer with expertise in systems engineering, distributed systems, caching, network protocols, C++, Python, and scalability. You will build and scale systems that support billions of users.",
    data_analyst: "Meta seeks a Data Analyst: SQL, Python, Excel, metrics definitions, and dashboard creation. You will analyze user growth and define product metrics."
  },
  stripe: {
    swe: "Stripe is seeking a Software Engineer to join our payments platform. Strong skills in Ruby, Python, Go, API design, security, databases (SQL), and distributed systems are required.",
    junior: "Junior Software Engineer: experience with Python, JavaScript, Git, and web standards. You will write unit tests, build UI modules, and resolve database performance issues."
  },
  netflix: {
    business_analyst: "Netflix is looking for a Business Analyst. Requirements: SQL, Python, Tableau, data mining, forecasting, and KPI dashboards. You will work with streaming content teams."
  },
  apple: {
    business_analyst: "Apple is looking for a Business Analyst: SQL, Tableau, business metrics, financial analysis, spreadsheets, and stakeholder communications."
  }
};

export const COMPANY_NAMES: Record<string, string> = { google: "Google", meta: "Meta", stripe: "Stripe", netflix: "Netflix", apple: "Apple" };
export const ROLE_NAMES: Record<string, string> = { swe: "Software Engineer", junior: "Junior Developer", data_analyst: "Data Analyst", business_analyst: "Business Analyst", pm: "Product Manager" };

export const AI_MSGS = [
  "Reading your resume…",
  "Parsing work experience…",
  "Checking ATS compatibility…",
  "Analyzing keyword density…",
  "Finding measurable achievements…",
  "Matching skills to role requirements…",
  "Evaluating section structure…",
  "Generating AI recommendations…",
  "Compiling final report…",
];
