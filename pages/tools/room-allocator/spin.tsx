import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';
import SpinningWheel from '../../../components/SpinningWheel';
import ReactConfetti from 'react-confetti';
import { X } from 'react-feather';

interface RoomAllocation {
  person: string;
  room: string;
}

// Add this new component for the results modal
function ResultsModal({
  allocations,
  onClose,
}: {
  allocations: RoomAllocation[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-lg w-full p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-center">
            🎉 Room Allocations Complete!
          </h2>

          <div className="space-y-4">
            {allocations.map((allocation, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">👤</span>
                  <span className="font-medium">{allocation.person}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">{allocation.room}</span>
                  <span className="text-2xl">🚪</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpinPage() {
  const router = useRouter();
  const { housemates: housematesQuery, rooms: roomsQuery } = router.query;

  const [housemates, setHousemates] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [remainingHousemates, setRemainingHousemates] = useState<string[]>([]);
  const [remainingRooms, setRemainingRooms] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinType, setCurrentSpinType] = useState<'person' | 'room'>(
    'person'
  );
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (housematesQuery && roomsQuery) {
      const parsedHousemates = JSON.parse(
        decodeURIComponent(housematesQuery as string)
      );
      const parsedRooms = JSON.parse(decodeURIComponent(roomsQuery as string));
      setHousemates(parsedHousemates);
      setRooms(parsedRooms);
      setRemainingHousemates(parsedHousemates);
      setRemainingRooms(parsedRooms);
    }
  }, [housematesQuery, roomsQuery]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startAllocation = () => {
    setAllocations([]);
    spinForPerson();
  };

  const spinForPerson = () => {
    setCurrentSpinType('person');
    setIsSpinning(true);
  };

  const spinForRoom = () => {
    setCurrentSpinType('room');
    setIsSpinning(true);
  };

  const handleSpinEnd = (result: string) => {
    setIsSpinning(false);

    if (currentSpinType === 'person') {
      setSelectedPerson(result);

      // If there are only 2 rooms total, assign the other room to the other person immediately
      if (housemates.length === 2) {
        const otherPerson = remainingHousemates.find((h) => h !== result)!;
        const firstRoom = remainingRooms[0];
        const secondRoom = remainingRooms[1];

        const finalAllocations = [
          { person: result, room: firstRoom },
          { person: otherPerson, room: secondRoom },
        ];

        setAllocations(finalAllocations);
        setRemainingHousemates([]);
        setRemainingRooms([]);
        setSelectedPerson(null);

        // Show completion effects
        setTimeout(() => {
          setShowConfetti(true);
          setShowModal(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }, 500);
      }
      // If this is the second-to-last allocation, assign the last room automatically
      else if (remainingRooms.length === 2) {
        setTimeout(spinForRoom, 1000);
      } else {
        setTimeout(spinForRoom, 1000);
      }
    } else {
      if (selectedPerson) {
        const newAllocation = { person: selectedPerson, room: result };
        const updatedAllocations = [...allocations, newAllocation];

        const updatedHousemates = remainingHousemates.filter(
          (h) => h !== selectedPerson
        );
        const updatedRooms = remainingRooms.filter((r) => r !== result);

        // If this was the second-to-last allocation, assign the last room automatically
        if (updatedHousemates.length === 1 && updatedRooms.length === 1) {
          const finalAllocations = [
            ...updatedAllocations,
            { person: updatedHousemates[0], room: updatedRooms[0] },
          ];

          setAllocations(finalAllocations);
          setRemainingHousemates([]);
          setRemainingRooms([]);
          setSelectedPerson(null);

          // Show completion effects
          setTimeout(() => {
            setShowConfetti(true);
            setShowModal(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }, 500);
        } else {
          setAllocations(updatedAllocations);
          setRemainingHousemates(updatedHousemates);
          setRemainingRooms(updatedRooms);
          setSelectedPerson(null);
          setTimeout(spinForPerson, 1000);
        }
      }
    }
  };

  const handleStartOver = () => {
    router.push('/tools/room-allocator');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          className="fixed inset-0 z-[100]"
        />
      )}

      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold mt-20">🎲 Time to Spin!</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Let's randomly assign {housemates.length} rooms to your housemates.
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={startAllocation}
            disabled={isSpinning || allocations.length === housemates.length}
            className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 mb-8"
          >
            Start Room Allocation
          </button>

          {(remainingHousemates.length > 0 || isSpinning) && (
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold mb-4">
                {currentSpinType === 'person'
                  ? remainingHousemates.length === 1
                    ? `Last person: ${remainingHousemates[0]}`
                    : 'Spinning for next person...'
                  : remainingRooms.length === 1
                  ? `Last room: ${remainingRooms[0]}`
                  : `Spinning for ${selectedPerson}'s room...`}
              </h3>
              <SpinningWheel
                options={
                  currentSpinType === 'person'
                    ? remainingHousemates
                    : remainingRooms
                }
                onSpinEnd={handleSpinEnd}
                isSpinning={isSpinning}
              />
            </div>
          )}

          {!isSpinning && remainingHousemates.length === 0 && (
            <button
              onClick={handleStartOver}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 mb-20"
            >
              Start Over
            </button>
          )}
        </div>
      </main>

      {showModal && (
        <ResultsModal
          allocations={allocations}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
