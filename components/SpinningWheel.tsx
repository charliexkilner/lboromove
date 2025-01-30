import { useState, useEffect } from 'react';

interface SpinningWheelProps {
  options: string[];
  onSpinEnd: (result: string) => void;
  isSpinning: boolean;
}

export default function SpinningWheel({
  options,
  onSpinEnd,
  isSpinning,
}: SpinningWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    if (isSpinning) {
      const spinDuration = 3000; // 3 seconds
      const totalRotation = 360 * 5 + Math.random() * 360; // 5 full rotations + random

      setRotation(totalRotation);

      setTimeout(() => {
        const finalRotation = totalRotation % 360;
        const segmentSize = 360 / options.length;
        const selectedIndex = Math.floor(
          (360 - (finalRotation % 360)) / segmentSize
        );
        setSelectedOption(options[selectedIndex]);
        onSpinEnd(options[selectedIndex]);
      }, spinDuration);
    }
  }, [isSpinning, options, onSpinEnd]);

  return (
    <div className="relative w-80 h-80 mx-auto">
      <div
        className="absolute inset-0 rounded-full border-4 border-purple-900"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning
            ? 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)'
            : '',
        }}
      >
        {options.map((option, index) => {
          const angle = (360 / options.length) * index;
          const rotate = angle + 360 / options.length / 2;

          return (
            <div
              key={option}
              className="absolute w-full h-full"
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: '50% 50%',
              }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2"
                style={{ backgroundColor: '#312e81' }}
              />
              <span
                className="absolute top-12 left-1/2 -translate-x-1/2 text-sm font-bold text-purple-900"
                style={{
                  transform: `rotate(${rotate}deg)`,
                }}
              >
                {option}
              </span>
            </div>
          );
        })}
      </div>
      {/* Arrow pointer */}
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8">
        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-purple-900 border-b-8 border-b-transparent" />
      </div>
    </div>
  );
}
