import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { Check, ArrowRight } from 'lucide-react';

interface ChecklistItem {
  id: string;
  task: string;
  description: string;
  isCompleted: boolean;
  category: string;
}

export default function MoveInChecklist() {
  const { t } = useTranslation('common');
  
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Essential Documents
    {
      id: '1',
      task: 'University acceptance letter',
      description: 'You may need this for ID checks.',
      isCompleted: false,
      category: 'documents'
    },
    {
      id: '2',
      task: 'Student ID & Passport',
      description: 'For identity verification.',
      isCompleted: false,
      category: 'documents'
    },
    {
      id: '3',
      task: 'Rental agreement/tenancy contract',
      description: 'Make sure it\'s signed and stored safely.',
      isCompleted: false,
      category: 'documents'
    },
    {
      id: '4',
      task: 'Proof of address',
      description: 'Bank letter, tenancy agreement, utility bill - some services require this.',
      isCompleted: false,
      category: 'documents'
    },
    {
      id: '5',
      task: 'Emergency contact details',
      description: 'Just in case!',
      isCompleted: false,
      category: 'documents'
    },
    
    // Bedroom Essentials - Bedding & Comfort
    {
      id: '6',
      task: 'Duvet & Pillows',
      description: 'Some student homes provide them, but it\'s best to check.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '7',
      task: 'Bedsheets & Covers',
      description: 'At least two sets, so you have a backup.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '8',
      task: 'Mattress Protector',
      description: 'Keeps your bed clean and lasts longer.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '9',
      task: 'Cushions & Throws',
      description: 'For extra comfort and a cozy touch.',
      isCompleted: false,
      category: 'bedroom'
    },
    
    // Bedroom Essentials - Lighting & Storage
    {
      id: '10',
      task: 'Desk Lamp',
      description: 'Perfect for late-night study sessions.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '11',
      task: 'Clothes Hangers',
      description: 'Helps keep your wardrobe organized.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '12',
      task: 'Storage Boxes',
      description: 'Great for under-bed storage and saving space.',
      isCompleted: false,
      category: 'bedroom'
    },
    {
      id: '13',
      task: 'Over-the-Door Hooks',
      description: 'Useful for coats, towels, and bags.',
      isCompleted: false,
      category: 'bedroom'
    },
    
    // Kitchen Essentials
    {
      id: '14',
      task: 'Plates, Bowls & Cutlery',
      description: 'One set per person is usually enough.',
      isCompleted: false,
      category: 'kitchen'
    },
    {
      id: '15',
      task: 'Mugs & Glasses',
      description: 'A must for tea, coffee, and water.',
      isCompleted: false,
      category: 'kitchen'
    },
    {
      id: '16',
      task: 'Cooking Utensils',
      description: 'Spatula, tongs, wooden spoon, whisk - for basic cooking.',
      isCompleted: false,
      category: 'kitchen'
    },
    {
      id: '17',
      task: 'Pots & Pans',
      description: 'At least one frying pan and one saucepan.',
      isCompleted: false,
      category: 'kitchen'
    },
    {
      id: '18',
      task: 'Food Storage Containers',
      description: 'For leftovers and meal prep.',
      isCompleted: false,
      category: 'kitchen'
    },
    {
      id: '19',
      task: 'Dish Soap & Sponges',
      description: 'To keep everything clean.',
      isCompleted: false,
      category: 'kitchen'
    },
    
    // Bathroom Essentials
    {
      id: '20',
      task: 'Towels (Face, Hand & Bath)',
      description: 'At least two sets.',
      isCompleted: false,
      category: 'bathroom'
    },
    {
      id: '21',
      task: 'Toiletries',
      description: 'Shampoo, soap, toothpaste, etc.',
      isCompleted: false,
      category: 'bathroom'
    },
    {
      id: '22',
      task: 'Shower Caddy',
      description: 'Especially useful for shared bathrooms.',
      isCompleted: false,
      category: 'bathroom'
    },
    {
      id: '23',
      task: 'Toilet Paper',
      description: 'Don\'t forget this on day one!',
      isCompleted: false,
      category: 'bathroom'
    },
    {
      id: '24',
      task: 'Bath Mat',
      description: 'Prevents slipping and keeps floors dry.',
      isCompleted: false,
      category: 'bathroom'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'documents', name: 'Essential Documents' },
    { id: 'bedroom', name: 'Bedroom Essentials' },
    { id: 'kitchen', name: 'Kitchen Essentials' },
    { id: 'bathroom', name: 'Bathroom Essentials' },
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
        <title>
          Student Move-In Checklist | Complete Guide for Loughborough Students
        </title>
        <meta
          name="description"
          content="Complete student move-in checklist for Loughborough University students. Essential items, tips, and guidance for a stress-free move into your student house."
        />
        <meta
          name="keywords"
          content="student move-in checklist, Loughborough student housing, student accommodation checklist, university moving guide"
        />
        {/* Open Graph tags for social sharing */}
        <meta
          property="og:title"
          content="Student Move-In Checklist | Complete Guide for Loughborough Students"
        />
        <meta
          property="og:description"
          content="Essential checklist and tips for moving into your Loughborough student house. Make your move-in day stress-free!"
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content="https://lboromove.com/student-move-in-checklist"
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
            <h1 className="text-4xl font-bold mb-4 text-center uppercase">
              Student Move-In Checklist
            </h1>
            <p className="text-xl text-center text-purple-100 lowercase">
              Your Ultimate Guide to a Stress-Free Student Move-In Day
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
            <h2 className="text-xl font-bold mb-4">Moving Into Your Student Home</h2>
            <p className="text-gray-700 mb-4">
              Moving into your <strong>student home in Loughborough</strong> (or any university city) is <strong>exciting but stressful</strong>—you don't want to arrive and realize you've forgotten essentials like bedding, chargers, or kitchen supplies! This checklist will help ensure you have everything you need.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800">
                <strong className="text-lg">LboroMove Tip:</strong>
                <br /> Store digital copies of important documents on Google Drive or Dropbox so you can access them anywhere!
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Your Move-In Checklist</h2>
              <p className="text-gray-700">
                Check off each item as you pack or purchase it.
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
            <h2 className="text-xl font-bold mb-4">Top Move-In Tips</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-1">⏰</span>
                <div>
                  <strong className="text-gray-900">Plan your arrival time</strong>
                  <p className="text-gray-600">Check when you can collect keys and arrive during office hours on weekdays if possible.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-1">📋</span>
                <div>
                  <strong className="text-gray-900">Do a thorough inventory check</strong>
                  <p className="text-gray-600">Take photos of any existing damage to avoid deposit disputes later.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-1">🛒</span>
                <div>
                  <strong className="text-gray-900">Shop locally after arrival</strong>
                  <p className="text-gray-600">Bring essentials first, then buy bulky or heavy items locally to save transport space.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-xl flex-shrink-0 mt-1">🔒</span>
                <div>
                  <strong className="text-gray-900">Secure your valuables</strong>
                  <p className="text-gray-600">Consider a small lockbox for important documents and valuable items.</p>
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
