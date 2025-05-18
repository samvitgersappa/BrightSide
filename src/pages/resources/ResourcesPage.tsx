import React from 'react';

const emotionalWellbeingResources = [
  {
    title: 'Mental Health America',
    url: 'https://screening.mhanational.org/screening-tools/',
    description: 'Free mental health screening tools and support resources.'
  },
  {
    title: 'Psychology Today',
    url: 'https://www.psychologytoday.com/us/basics',
    description: 'Expert insights on mental health, relationships, and personal growth.'
  },
  {
    title: 'Crisis Text Line',
    url: 'https://www.crisistextline.org/',
    description: 'Free 24/7 support - Text HOME to 741741 to connect with a Crisis Counselor.'
  },
  {
    title: 'Headspace',
    url: 'https://www.headspace.com/science',
    description: 'Science-backed meditation and mindfulness techniques.'
  },
  {
    title: 'NIMH',
    url: 'https://www.nimh.nih.gov/health',
    description: 'National Institute of Mental Health - reliable mental health information.'
  }
];

const debatePreparationResources = [
  {
    title: 'ProCon.org',
    url: 'https://www.procon.org/',
    description: 'Balanced, sourced pros and cons for controversial topics.'
  },
  {
    title: 'Kialo',
    url: 'https://www.kialo.com/',
    description: 'Interactive platform for structured debates and discussions.'
  },
  {
    title: 'Stanford Encyclopedia of Philosophy',
    url: 'https://plato.stanford.edu/',
    description: 'Deep analysis of philosophical arguments and concepts.'
  },
  {
    title: 'Yale Debate Association',
    url: 'https://yaledebate.org/resources/',
    description: 'Debate resources from one of the top collegiate debate programs.'
  },
  {
    title: 'Khan Academy - Argumentation',
    url: 'https://www.khanacademy.org/ela/cc-6th-reading-vocab/x8c8165c7dcd5e900:cc-6th-arguments',
    description: 'Free lessons on constructing strong arguments.'
  }
];

const researchTools = [
  {
    title: 'Google Scholar',
    url: 'https://scholar.google.com/',
    description: 'Search scholarly literature for evidence-based arguments.'
  },
  {
    title: 'Our World in Data',
    url: 'https://ourworldindata.org/',
    description: 'Research and data visualizations on global issues.'
  },
  {
    title: 'Pew Research',
    url: 'https://www.pewresearch.org/',
    description: 'Nonpartisan data about social issues, public opinion, and trends.'
  },
  {
    title: 'Internet Archive Scholar',
    url: 'https://scholar.archive.org/',
    description: 'Free access to millions of research papers and books.'
  }
];

const communicationSkills = [
  {
    title: 'Toastmasters Find a Club',
    url: 'https://www.toastmasters.org/find-a-club',
    description: 'Join local public speaking clubs to practice debate skills.'
  },
  {
    title: 'TED Masterclass',
    url: 'https://masterclass.ted.com/',
    description: 'Learn the art of public speaking from TED speakers.'
  },
  {
    title: 'Hemingway Editor',
    url: 'https://hemingwayapp.com/',
    description: 'Free tool to make your writing clear and impactful.'
  },
  {
    title: 'Coursera Public Speaking',
    url: 'https://www.coursera.org/courses?query=public%20speaking',
    description: 'Free online courses to improve speaking skills.'
  }
];

const crisisSupport = [
  {
    title: 'AASRA (India)',
    url: 'http://www.aasra.info/',
    description: '24/7 Helpline: 91-9820466726 - Mental health support and suicide prevention in India.'
  },
  {
    title: 'iCall (India)',
    url: 'https://icallhelpline.org/',
    description: 'Call 022-25521111 (Monday to Saturday, 8:00 AM to 10:00 PM IST) - Professional counseling service by TISS.'
  },
  {
    title: 'Vandrevala Foundation (India)',
    url: 'https://vandrevalafoundation.com/',
    description: '24/7 Helpline: 1860-2662-345 / +91 9999666555 - Mental health support in India.'
  },
  {
    title: 'NIMHANS (India)',
    url: 'https://nimhans.ac.in/',
    description: 'Toll-free: 080-46110007 - National Institute of Mental Health and Neurosciences.'
  },
  {
    title: 'Sneha India',
    url: 'https://snehaindia.org/',
    description: '044-24640050 (24/7) - Suicide prevention and emotional support helpline in Chennai.'
  },
  {
    title: 'Parivarthan (India)',
    url: 'https://parivarthan.org/',
    description: '+91-7676602602 (Mon-Fri, 4-10 PM IST) - Counselling helpline based in Bangalore.'
  }
];

const educationalResources = [
  {
    title: 'Coursera',
    url: 'https://www.coursera.org/',
    description: 'Free online courses from top universities worldwide.'
  },
  {
    title: 'edX',
    url: 'https://www.edx.org/',
    description: 'Access to high-quality courses from leading institutions.'
  },
  {
    title: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu/',
    description: 'Free access to MIT course materials.'
  },
  {
    title: 'SWAYAM',
    url: 'https://swayam.gov.in/',
    description: 'Free online education platform by Government of India.'
  }
];

const selfImprovementTools = [
  {
    title: 'Insight Timer',
    url: 'https://insighttimer.com/',
    description: 'Free meditation app with thousands of guided sessions.'
  },
  {
    title: 'Bullet Journal',
    url: 'https://bulletjournal.com/pages/learn',
    description: 'Digital and analog organization method for productivity.'
  },
  {
    title: 'Mindfulness.com',
    url: 'https://www.mindfulness.com/',
    description: 'Daily mindfulness practices and exercises.'
  },
  {
    title: 'Duolingo',
    url: 'https://www.duolingo.com/',
    description: 'Free language learning platform to enhance communication skills.'
  }
];

const ResourcesPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-indigo-800">Resources</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🧠</span>
            Emotional Wellbeing
          </h2>
          <ul className="space-y-3">
            {emotionalWellbeingResources.map((res) => (
              <li key={res.url} className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-indigo-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🎯</span>
            Debate Preparation
          </h2>
          <ul className="space-y-3">
            {debatePreparationResources.map((res) => (
              <li key={res.url} className="bg-green-50 p-4 rounded-lg border border-green-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-green-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">📚</span>
            Research Tools
          </h2>
          <ul className="space-y-3">
            {researchTools.map((res) => (
              <li key={res.url} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🎤</span>
            Communication Skills
          </h2>
          <ul className="space-y-3">
            {communicationSkills.map((res) => (
              <li key={res.url} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-purple-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🆘</span>
            Crisis Support (India)
          </h2>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
            <p className="text-red-800 text-sm">If you're experiencing a mental health emergency, please contact any of these 24/7 helpline numbers for immediate assistance.</p>
          </div>
          <ul className="space-y-3">
            {crisisSupport.map((res) => (
              <li key={res.url} className="bg-red-50 p-4 rounded-lg border border-red-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-red-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">📖</span>
            Educational Resources
          </h2>
          <ul className="space-y-3">
            {educationalResources.map((res) => (
              <li key={res.url} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-yellow-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <span className="mr-2">🌱</span>
            Self-Improvement Tools
          </h2>
          <ul className="space-y-3">
            {selfImprovementTools.map((res) => (
              <li key={res.url} className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-orange-700 font-medium hover:underline">
                  {res.title}
                </a>
                <p className="text-gray-700 text-sm mt-1">{res.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default ResourcesPage;
