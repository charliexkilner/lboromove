import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Navbar from '../../components/Navbar';
import SpinningWheel from '../../components/SpinningWheel';
import { useRouter } from 'next/router';

interface RoomAllocation {
  person: string;
  room: string;
}

export default function RoomAllocator() {
  const [numRooms, setNumRooms] = useState<number>(2);
  const [housemates, setHousemates] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  const [remainingHousemates, setRemainingHousemates] = useState<string[]>([]);
  const [remainingRooms, setRemainingRooms] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinType, setCurrentSpinType] = useState<'person' | 'room'>(
    'person'
  );
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const router = useRouter();

  const handleNumRoomsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value) || 0;
    setNumRooms(num);
    if (num < housemates.length) {
      setHousemates((prev) => prev.slice(0, num));
      setRooms((prev) => prev.slice(0, num));
    }
    setAllocations([]);
  };

  const addHousemate = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentName && housemates.length < numRooms) {
      setHousemates([...housemates, currentName]);
      setCurrentName('');
    }
  };

  const addRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRoom && rooms.length < numRooms) {
      setRooms([...rooms, currentRoom]);
      setCurrentRoom('');
    }
  };

  const handleStartSpinning = () => {
    if (housemates.length === numRooms && rooms.length === numRooms) {
      const queryParams = new URLSearchParams({
        housemates: encodeURIComponent(JSON.stringify(housemates)),
        rooms: encodeURIComponent(JSON.stringify(rooms)),
      });
      router.push(`/tools/room-allocator/spin?${queryParams.toString()}`);
    }
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
      setTimeout(spinForRoom, 1000);
    } else {
      if (selectedPerson) {
        const newAllocation = { person: selectedPerson, room: result };
        setAllocations([...allocations, newAllocation]);
        setRemainingHousemates(
          remainingHousemates.filter((h) => h !== selectedPerson)
        );
        setRemainingRooms(remainingRooms.filter((r) => r !== result));
        setSelectedPerson(null);

        if (allocations.length + 1 < numRooms) {
          setTimeout(spinForPerson, 1000);
        }
      }
    }
  };

  const incrementRooms = () => {
    setNumRooms((prev) => prev + 1);
    setAllocations([]);
  };

  const decrementRooms = () => {
    setNumRooms((prev) => Math.max(1, prev - 1));
    setHousemates((prev) => prev.slice(0, Math.max(1, prev.length - 1)));
    setRooms((prev) => prev.slice(0, Math.max(1, prev.length - 1)));
    setAllocations([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 mt-20">
            🎲 Random Room Allocator
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Allocating rooms can be an awkward decision to make in your shared
            house, so let us make it for you.
          </p>
        </div>

        {/* Number of Rooms Input */}
        <div className="mb-12">
          <label className="block text-xl font-semibold mb-4 text-center">
            How many bedrooms?
          </label>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={decrementRooms}
              className="w-10 h-10 rounded-l-md bg-white border flex items-center justify-center hover:bg-gray-50"
            >
              <span className="text-xl font-medium text-gray-600">−</span>
            </button>
            <div className="w-32 h-10 bg-white border-t border-b flex items-center justify-center">
              <span className="text-gray-900">
                {numRooms} {numRooms === 1 ? 'bedroom' : 'bedrooms'}
              </span>
            </div>
            <button
              onClick={incrementRooms}
              className="w-10 h-10 rounded-r-md bg-white border flex items-center justify-center hover:bg-gray-50"
            >
              <span className="text-xl font-medium text-gray-600">+</span>
            </button>
          </div>
        </div>

        {numRooms > 0 && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Housemates Input */}
            <div className="mb-8 md:mb-0">
              <h2 className="text-xl font-semibold mb-4">
                Add Housemates ({housemates.length}/{numRooms})
              </h2>
              <form onSubmit={addHousemate} className="mb-4">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  placeholder="Enter housemate name"
                  className="w-full p-2 border rounded-md mb-2"
                />
                <button
                  type="submit"
                  disabled={housemates.length >= numRooms}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Add Housemate
                </button>
              </form>
              <ul className="space-y-2">
                {housemates.map((name, index) => (
                  <li
                    key={index}
                    className="p-2 bg-white rounded-md shadow flex justify-between items-center"
                  >
                    <span>{name}</span>
                    <button
                      onClick={() =>
                        setHousemates(housemates.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rooms Input */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Add Rooms ({rooms.length}/{numRooms})
              </h2>
              <form onSubmit={addRoom} className="mb-4">
                <input
                  type="text"
                  value={currentRoom}
                  onChange={(e) => setCurrentRoom(e.target.value)}
                  placeholder="Enter room name/number"
                  className="w-full p-2 border rounded-md mb-2"
                />
                <button
                  type="submit"
                  disabled={rooms.length >= numRooms}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Add Room
                </button>
              </form>
              <ul className="space-y-2">
                {rooms.map((room, index) => (
                  <li
                    key={index}
                    className="p-2 bg-white rounded-md shadow flex justify-between items-center"
                  >
                    <span>{room}</span>
                    <button
                      onClick={() =>
                        setRooms(rooms.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Spinning Wheel Section */}
        {housemates.length === numRooms && rooms.length === numRooms && (
          <div className="mt-0 mb-20">
            <button
              onClick={handleStartSpinning}
              className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 mb-8"
            >
              Start Room Allocation
            </button>
          </div>
        )}
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
