import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import Head from 'next/head';
import { ArrowRight } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  size: number;
  windows: string;
  closet: string;
  features: string[];
  calculatedRent: number;
}

interface RoomFeature {
  id: string;
  label: string;
  value: number;
}

export default function SplitRentCalculator() {
  const { t } = useTranslation('common');
  const [totalRent, setTotalRent] = useState<number>(0);
  const [numRooms, setNumRooms] = useState<number>(2);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCalculationComplete, setIsCalculationComplete] = useState<boolean>(false);

  const roomSizes = [
    { id: 'tiny', label: 'Tiny', value: 50 },
    { id: 'small', label: 'Small', value: 65 },
    { id: 'bit-small', label: 'A bit small', value: 80 },
    { id: 'normal', label: 'Normal', value: 100 },
    { id: 'generous', label: 'Generous', value: 125 },
    { id: 'large', label: 'Large', value: 160 },
    { id: 'enormous', label: 'Enormous', value: 200 }
  ];

  const windowOptions = [
    { id: 'none', label: 'None', value: -10 },
    { id: 'normal', label: 'Normal', value: 0 },
    { id: 'awesome', label: 'Awesome', value: 15 }
  ];

  const closetOptions = [
    { id: 'none', label: 'None', value: -5 },
    { id: 'normal', label: 'Normal', value: 0 },
    { id: 'huge', label: 'Huge', value: 10 }
  ];

  const otherFeatures: RoomFeature[] = [
    { id: 'shared', label: 'Room shared by two people', value: -20 },
    { id: 'full-bath', label: 'Private full bath', value: 25 },
    { id: 'half-bath', label: 'Private half-bath', value: 15 },
    { id: 'bad-sound', label: 'Bad sound isolation', value: -10 },
    { id: 'awkward', label: 'Awkward room layout', value: -10 },
    { id: 'no-door', label: 'No door', value: -15 }
  ];

  useEffect(() => {
    // Initialize rooms when numRooms changes
    const initialRooms = Array.from({ length: numRooms }, (_, i) => ({
      id: `room-${i + 1}`,
      name: `Room #${i + 1}`,
      size: 100, // Default to normal
      windows: 'normal',
      closet: 'normal',
      features: [],
      calculatedRent: 0
    }));
    setRooms(initialRooms);
    setIsCalculationComplete(false);
  }, [numRooms]);

  const incrementRooms = () => {
    if (numRooms < 8) {
      setNumRooms(prev => prev + 1);
    }
  };

  const decrementRooms = () => {
    if (numRooms > 1) {
      setNumRooms(prev => prev - 1);
    }
  };

  const handleRoomNameChange = (roomId: string, newName: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, name: newName } : room
    ));
  };

  const handleRoomSizeChange = (roomId: string, sizeValue: number) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, size: sizeValue } : room
    ));
  };

  const handleWindowChange = (roomId: string, windowType: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, windows: windowType } : room
    ));
  };

  const handleClosetChange = (roomId: string, closetType: string) => {
    setRooms(rooms.map(room => 
      room.id === roomId ? { ...room, closet: closetType } : room
    ));
  };

  const toggleFeature = (roomId: string, featureId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const features = room.features.includes(featureId)
          ? room.features.filter(f => f !== featureId)
          : [...room.features, featureId];
        return { ...room, features };
      }
      return room;
    }));
  };

  const calculateRent = () => {
    // Calculate total points
    let totalPoints = 0;
    const roomsWithPoints = rooms.map(room => {
      let points = room.size;
      
      // Add window points
      const windowOption = windowOptions.find(w => w.id === room.windows);
      if (windowOption) points += windowOption.value;
      
      // Add closet points
      const closetOption = closetOptions.find(c => c.id === room.closet);
      if (closetOption) points += closetOption.value;
      
      // Add feature points
      room.features.forEach(featureId => {
        const feature = otherFeatures.find(f => f.id === featureId);
        if (feature) points += feature.value;
      });
      
      // Ensure points are at least 10 (minimum value)
      points = Math.max(10, points);
      
      return { ...room, points };
    });
    
    roomsWithPoints.forEach(room => {
      totalPoints += room.points;
    });
    
    // Calculate rent for each room
    const calculatedRooms = roomsWithPoints.map(room => {
      const ratio = room.points / totalPoints;
      const roomRent = Math.round(totalRent * ratio);
      return { ...room, calculatedRent: roomRent };
    });
    
    setRooms(calculatedRooms);
    setIsCalculationComplete(true);
    setCurrentStep(3);
  };

  const nextStep = () => {
    if (currentStep === 1 && totalRent > 0) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      calculateRent();
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      if (currentStep === 3) {
        setIsCalculationComplete(false);
      }
    }
  };

  // Progress bar component
  const ProgressBar = () => {
    const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;
    
    return (
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
        <div 
          className="bg-purple-600 h-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="bg-gray-100 p-6 sm:p-8 rounded-lg mb-6">
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-2 uppercase">
        Step One
        <span className="block text-sm text-gray-500">(of three)</span>
      </h2>
      
      <div className="mb-8 mt-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-2 space-y-2 sm:space-y-0">
          <label className="text-lg font-medium text-center sm:text-left">How much is the total monthly rent?</label>
          <div className="flex items-center max-w-[220px] mx-auto sm:mx-0">
            <span className="mr-2 text-xl">£</span>
            <input
              type="number"
              min="0"
              value={totalRent || ''}
              onChange={(e) => setTotalRent(Number(e.target.value))}
              className="w-full sm:w-48 p-3 border rounded-md text-lg"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-2 space-y-2 sm:space-y-0">
          <label className="text-lg font-medium text-center sm:text-left">How many bedrooms are there?</label>
          <div className="flex items-center justify-center sm:justify-start">
            <input
              type="number"
              min="1"
              max="20"
              value={numRooms}
              onChange={(e) => setNumRooms(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="w-24 p-3 border rounded-md text-center text-lg"
            />
            <span className="ml-2 text-lg">bedrooms</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-8 mb-8">
        <button
          onClick={nextStep}
          disabled={totalRent <= 0}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-md disabled:bg-gray-400 flex items-center justify-center group"
        >
          Next step
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-white" />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  const renderRoomCard = (room: Room, index: number) => (
    <div key={room.id} className="bg-gray-100 p-4 sm:p-6 rounded-lg mb-6">
      <div className="mb-4">
        <label className="block text-lg font-medium mb-2">Room name:</label>
        <input
          type="text"
          value={room.name}
          onChange={(e) => handleRoomNameChange(room.id, e.target.value)}
          className="w-full max-w-[280px] p-3 border rounded-md text-base"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-500 mb-4 uppercase">How big is this room?</h3>
          {roomSizes.map(size => (
            <div key={size.id} className="flex items-center justify-between mb-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`size-${room.id}`}
                  checked={room.size === size.value}
                  onChange={() => handleRoomSizeChange(room.id, size.value)}
                  className="mr-2 h-4 w-4"
                />
                {size.label}
              </label>
              <span className="bg-black text-white px-3 py-1 rounded-sm text-center w-12">
                {size.value}
              </span>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-500 mb-4 uppercase">Windows:</h3>
            {windowOptions.map(option => (
              <div key={option.id} className="flex items-center mb-3">
                <input
                  type="radio"
                  name={`window-${room.id}`}
                  id={`window-${option.id}-${room.id}`}
                  checked={room.windows === option.id}
                  onChange={() => handleWindowChange(room.id, option.id)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor={`window-${option.id}-${room.id}`}>{option.label}</label>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-500 mb-4 uppercase">Closet:</h3>
            {closetOptions.map(option => (
              <div key={option.id} className="flex items-center mb-3">
                <input
                  type="radio"
                  name={`closet-${room.id}`}
                  id={`closet-${option.id}-${room.id}`}
                  checked={room.closet === option.id}
                  onChange={() => handleClosetChange(room.id, option.id)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor={`closet-${option.id}-${room.id}`}>{option.label}</label>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-500 mb-4 uppercase">Other factors:</h3>
            {otherFeatures.map(feature => (
              <div key={feature.id} className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id={`feature-${feature.id}-${room.id}`}
                  checked={room.features.includes(feature.id)}
                  onChange={() => toggleFeature(room.id, feature.id)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor={`feature-${feature.id}-${room.id}`}>{feature.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-6 uppercase">
        Step Two
        <span className="block text-sm text-gray-500">(of three)</span>
      </h2>
      
      {rooms.map((room, index) => renderRoomCard(room, index))}
      
      <div className="flex flex-row justify-between mt-8 space-x-3 mb-8">
        <button
          onClick={previousStep}
          className="w-[20%] bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-2 rounded-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="w-[80%] bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-3 rounded-md flex items-center justify-center group"
        >
          Calculate fair rent
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-white" />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-gray-100 p-4 sm:p-8 rounded-lg mb-6">
      <h2 className="text-2xl font-semibold text-center mb-4 uppercase">
        Step Three
        <span className="block text-sm text-gray-500">(of three)</span>
      </h2>
      
      <h3 className="text-xl font-semibold text-center mt-6 mb-4">Here's how you should split the rent:</h3>
      
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Room</th>
              <th className="text-right py-2 px-2">Suggested rent</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-b">
                <td className="py-3 px-2">{room.name}</td>
                <td className="text-right py-3 px-2 font-semibold">£{room.calculatedRent}</td>
              </tr>
            ))}
            <tr>
              <td className="py-3 px-2 font-bold">Total</td>
              <td className="text-right py-3 px-2 font-bold">£{totalRent}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 text-center space-y-6 mb-8">
        <div className="text-center space-y-2">
          <p className="text-gray-600">Curious about how our fairness calculator works?</p>
          <p>
            The calculator assigns points to each room based on size, window quality, 
            closet space, and other features.<br></br>It then divides the total rent proportionally.
          </p>
        </div>
        
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-md flex items-center justify-center group mx-auto"
        >
          Start over
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 text-white" />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{t('tools.split_rent.title')} | Lboro Move</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="sm:text-4xl text-2xl font-bold mb-4 mt-20 uppercase">
            💰 Split Rent Calculator
          </h1>
          <p className="text-gray-600 sm:text-lg text-md max-w-2xl mx-auto lowercase">
            Calculate fair rent splits based on room sizes and features
          </p>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
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