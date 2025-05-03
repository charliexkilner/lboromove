import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import Head from 'next/head';
import { Check, ArrowRight } from 'lucide-react';

interface ChecklistItem {
  id: string;
  task: string;
  description: string;
  isCompleted: boolean;
  category: string;
}

export default function MoveOutChecklist() {
  const { t } = useTranslation('common');
  
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Before Moving Out
    {
      id: '1',
      task: 'Give proper notice to landlord',
      description: 'Check your tenancy agreement for required notice period (usually 1 month).',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '2',
      task: 'Schedule final inspection',
      description: 'Arrange a time with your landlord/agent for the final property inspection.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '3',
      task: 'Review your tenancy agreement',
      description: 'Check any specific move-out requirements mentioned in your contract.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '4',
      task: 'Sort through your belongings',
      description: 'Decide what to keep, sell, donate, or throw away before packing.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '5',
      task: 'Arrange for storage if needed',
      description: 'Book storage space if you need somewhere to keep belongings over summer.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '6',
      task: 'Cancel or transfer utilities',
      description: 'Contact gas, electricity, water, internet providers with your move-out date.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '7',
      task: 'Change your address',
      description: 'Update your address with bank, university, DVLA, etc.',
      isCompleted: false,
      category: 'before'
    },
    {
      id: '8',
      task: 'Set up mail forwarding',
      description: 'Set up a Royal Mail redirection service for any missed post.',
      isCompleted: false,
      category: 'before'
    },

    // Cleaning
    {
      id: '9',
      task: 'Remove all personal belongings',
      description: 'Take everything that belongs to you, including from storage areas.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '10',
      task: 'Clean kitchen thoroughly',
      description: 'Clean all appliances, countertops, cabinets, and floors.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '11',
      task: 'Clean bathroom thoroughly',
      description: 'Scrub toilet, shower/bath, sink, and floor. Remove limescale.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '12',
      task: 'Vacuum and mop all floors',
      description: 'Don\'t forget under beds, sofas and in corners.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '13',
      task: 'Clean windows and windowsills',
      description: 'Inside and out if accessible, including window tracks.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '14',
      task: 'Wipe down walls and baseboards',
      description: 'Remove marks, scuffs, and dust from all surfaces.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '15',
      task: 'Defrost and clean fridge/freezer',
      description: 'Turn off appliance 24 hours before cleaning to defrost properly.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '16',
      task: 'Clean oven and hob',
      description: 'Use appropriate cleaners to remove grease and food residue.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '17',
      task: 'Return furniture to original position',
      description: 'Place all furniture back where it was when you moved in.',
      isCompleted: false,
      category: 'cleaning'
    },
    {
      id: '18',
      task: 'Empty and clean bins',
      description: 'Take out all rubbish and clean the inside of bins.',
      isCompleted: false,
      category: 'cleaning'
    },
    
    // Final Day Tasks
    {
      id: '19',
      task: 'Take final meter readings',
      description: 'Record gas, electricity, and water meter readings with date-stamped photos.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '20',
      task: 'Take photos of the property',
      description: 'Document the clean, empty property as evidence of its condition.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '21',
      task: 'Check all cupboards and drawers',
      description: 'Look for any forgotten items, especially in high shelves and under appliances.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '22',
      task: 'Complete final inspection',
      description: 'Walk through with landlord/agent and address any concerns immediately.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '23',
      task: 'Return all keys',
      description: 'Hand over all sets of keys, including any spares, mailbox, or window keys.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '24',
      task: 'Confirm deposit return procedure',
      description: 'Discuss when and how your deposit will be returned.',
      isCompleted: false,
      category: 'final'
    },
    {
      id: '25',
      task: 'Secure the property',
      description: 'Close and lock all windows and doors before leaving.',
      isCompleted: false,
      category: 'final'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'before', name: 'Before Moving Out' },
    { id: 'cleaning', name: 'Cleaning' },
    { id: 'final', name: 'Final Day Tasks' },
  ];

  const handleToggleComplete = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const filteredItems = activeFilter === 'all' 
    ? checklist 
    : checklist.filter(item => item.category === activeFilter);

  const completedCount = checklist.filter(item => item.isCompleted).length;
  const totalItems = checklist.length;
  const progress = Math.round((completedCount / totalItems) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{t('tools.moveout_checklist.title')} | Lboro Move</title>
        <meta
          name="description"
          content="Complete student move-out checklist for Loughborough University students. Essential tasks, tips, and guidance for a stress-free end of tenancy."
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <h1 className="text-4xl font-bold mb-4 text-center uppercase">
            Student Move-Out Checklist
          </h1>
          <p className="text-xl text-center text-purple-100 lowercase">
            Your Complete Guide to a Stress-Free End of Tenancy
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Your Progress</h2>
            <span className="text-sm font-medium text-gray-500">
              {completedCount} of {totalItems} tasks completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeFilter === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Introduction Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Moving Out of Your Student Home</h2>
          <p className="text-gray-700 mb-4">
            Leaving your student accommodation properly is crucial for getting your deposit back and avoiding additional charges. 
            This checklist covers all essential tasks to ensure a smooth move-out process.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-purple-800">
              <strong className="text-lg">LboroMove Tip:</strong>
              <br /> Start preparing for your move-out at least 2-3 weeks in advance, especially during busy end-of-term periods.
              Book any cleaning services or moving help early as they get busy quickly during student move-out seasons.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold">Your Move-Out Checklist</h2>
            <p className="text-gray-700">
              Check off each task as you complete it.
            </p>
          </div>

          <ul className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                      item.isCompleted 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {item.isCompleted && <Check className="w-3 h-3" />}
                  </button>
                  <div className="flex-1">
                    <div className={`font-medium ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.task}
                    </div>
                    <p className={`text-sm ${item.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips & Advice */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Top Move-Out Tips</h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="text-xl flex-shrink-0 mt-1">⏰</span>
              <div>
                <strong className="text-gray-900">Start early</strong>
                <p className="text-gray-600">Begin packing and cleaning weeks before your move-out date to avoid last-minute stress.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl flex-shrink-0 mt-1">📋</span>
              <div>
                <strong className="text-gray-900">Check inventory</strong>
                <p className="text-gray-600">Use your original inventory or check-in report to ensure everything is present and in the right place.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl flex-shrink-0 mt-1">✍️</span>
              <div>
                <strong className="text-gray-900">Document everything</strong>
                <p className="text-gray-600">Take dated photos of the clean property as evidence of its condition when you leave.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-xl flex-shrink-0 mt-1">🧼</span>
              <div>
                <strong className="text-gray-900">Consider professional cleaning</strong>
                <p className="text-gray-600">If your tenancy requires professional cleaning or if you're short on time, book a service well in advance.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Print Button */}
        <div className="flex justify-center mt-8">
          <button 
            onClick={() => window.print()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-md flex items-center justify-center group"
          >
            Print Checklist
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-white" />
          </button>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}; 