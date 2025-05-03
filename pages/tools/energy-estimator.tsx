import { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../../components/Navbar';
import Head from 'next/head';
import { ArrowRight } from 'lucide-react';

interface ApplianceCount {
  [key: string]: number;
}

export default function EnergyEstimator() {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [accommodationType, setAccommodationType] = useState<string>('');
  const [occupants, setOccupants] = useState<number>(2);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [insulation, setInsulation] = useState<string>('');
  const [hasThermostats, setHasThermostats] = useState<boolean | null>(null);
  const [heatingType, setHeatingType] = useState<string>('');
  const [waterHeatingType, setWaterHeatingType] = useState<string>('');
  const [cookingType, setCookingType] = useState<string>('');
  const [appliances, setAppliances] = useState<ApplianceCount>({
    oven: 1,
    tv: 1,
    computer: 1,
    washingMachine: 1,
    fridge: 1,
    dishwasher: 1,
    dryingMachine: 0,
    freezer: 0
  });
  const [hoursHome, setHoursHome] = useState<string>('evenings');
  const [totalEstimate, setTotalEstimate] = useState({
    electric: 0,
    gas: 0,
    total: 0
  });
  const [isCalculationComplete, setIsCalculationComplete] = useState<boolean>(false);

  const incrementAppliance = (appliance: string) => {
    setAppliances(prev => ({
      ...prev,
      [appliance]: prev[appliance] + 1
    }));
  };

  const decrementAppliance = (appliance: string) => {
    if (appliances[appliance] > 0) {
      setAppliances(prev => ({
        ...prev,
        [appliance]: prev[appliance] - 1
      }));
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateEnergyCosts();
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateEnergyCosts = () => {
    // Base values (monthly estimates in £)
    const baseElectric = 45;
    const baseGas = 30;
    
    // Accommodation multipliers
    const accomMultiplier = accommodationType === 'house' ? 1.2 : 1;
    
    // Occupant factors
    const occupantElectricFactor = 1 + ((occupants - 1) * 0.3);
    const occupantGasFactor = 1 + ((occupants - 1) * 0.2);
    
    // Bedroom factor
    const bedroomFactor = 1 + ((bedrooms - 1) * 0.15);
    
    // Insulation factor
    let insulationFactor = 1;
    if (insulation === 'poor') insulationFactor = 1.3;
    if (insulation === 'excellent') insulationFactor = 0.8;
    
    // Thermostat factor
    const thermostatFactor = hasThermostats ? 0.9 : 1.1;
    
    // Hours at home factor
    const hoursFactor = hoursHome === 'allDay' ? 1.4 : 1;
    
    // Appliance count factor
    const applianceCount = Object.values(appliances).reduce((sum, count) => sum + count, 0);
    const applianceFactor = 1 + ((applianceCount - 3) * 0.08);
    
    // Heating type adjustments
    let electricMultiplier = 1;
    let gasMultiplier = 1;
    
    if (heatingType === 'electric') {
      electricMultiplier = 1.8;
      gasMultiplier = 0.2;
    } else if (heatingType === 'gas') {
      gasMultiplier = 1.5;
    }
    
    // Calculate estimates
    const electricEstimate = Math.round(
      baseElectric * accomMultiplier * occupantElectricFactor * 
      bedroomFactor * hoursFactor * applianceFactor * electricMultiplier
    );
    
    const gasEstimate = Math.round(
      baseGas * accomMultiplier * occupantGasFactor * 
      bedroomFactor * insulationFactor * thermostatFactor * gasMultiplier
    );
    
    setTotalEstimate({
      electric: electricEstimate,
      gas: gasEstimate,
      total: electricEstimate + gasEstimate
    });
    
    setIsCalculationComplete(true);
    setCurrentStep(4);
  };

  // Progress bar component
  const ProgressBar = () => {
    const progress = currentStep === 1 ? 25 : currentStep === 2 ? 50 : currentStep === 3 ? 75 : 100;
    
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
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-6 uppercase">
        Step One
        <span className="block text-sm text-gray-500">(of four)</span>
      </h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center text-center">Accommodation Type</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setAccommodationType('house')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                accommodationType === 'house' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🏠</span>
              <span className="font-medium">House</span>
            </button>
            <button
              onClick={() => setAccommodationType('flat')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                accommodationType === 'flat' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🏢</span>
              <span className="font-medium">Flat</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center text-center">How much are you at home?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setHoursHome('allDay')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                hoursHome === 'allDay' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🏡</span>
              <span className="font-medium">All Day</span>
            </button>
            <button
              onClick={() => setHoursHome('evenings')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                hoursHome === 'evenings' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🌙</span>
              <span className="font-medium">Evenings & Weekends</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-6 sm:flex-row sm:space-y-0 sm:space-x-8 justify-center">
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Number of occupants</h3>
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setOccupants(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 bg-gray-300 text-black rounded-l-md flex items-center justify-center"
              >
                <span className="text-xl">−</span>
              </button>
              <div className="w-12 h-10 bg-white border-t border-b border-gray-300 flex items-center justify-center">
                <span className="text-lg">{occupants}</span>
              </div>
              <button 
                onClick={() => setOccupants(prev => prev + 1)}
                className="w-10 h-10 bg-gray-300 text-black rounded-r-md flex items-center justify-center"
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Number of bedrooms</h3>
            <div className="flex items-center justify-center">
              <button 
                onClick={() => setBedrooms(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 bg-gray-300 text-black rounded-l-md flex items-center justify-center"
              >
                <span className="text-xl">−</span>
              </button>
              <div className="w-12 h-10 bg-white border-t border-b border-gray-300 flex items-center justify-center">
                <span className="text-lg">{bedrooms}</span>
              </div>
              <button 
                onClick={() => setBedrooms(prev => prev + 1)}
                className="w-10 h-10 bg-gray-300 text-black rounded-r-md flex items-center justify-center"
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-10 mb-8">
        <button
          onClick={nextStep}
          disabled={!accommodationType}
          className={`w-full sm:w-auto font-medium py-3 px-8 rounded-md flex items-center justify-center group transition-colors ${
            accommodationType
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next step
          <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${accommodationType ? 'group-hover:translate-x-1 text-white' : 'text-gray-500'}`} />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  const renderStep2 = () => (
    <div className="bg-gray-100 p-6 sm:p-8 rounded-lg mb-6">
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-6 uppercase">
        Step Two
        <span className="block text-sm text-gray-500">(of four)</span>
      </h2>
      
      <div className="space-y-10">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">Insulation Quality</h3>
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            <button
              onClick={() => setInsulation('excellent')}
              className={`flex flex-col items-center justify-center py-6 px-2 border rounded-lg ${
                insulation === 'excellent' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⭐⭐⭐</span>
              <span className="font-medium">Excellent</span>
            </button>
            <button
              onClick={() => setInsulation('average')}
              className={`flex flex-col items-center justify-center py-6 px-2 border rounded-lg ${
                insulation === 'average' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⭐⭐</span>
              <span className="font-medium">Average</span>
            </button>
            <button
              onClick={() => setInsulation('poor')}
              className={`flex flex-col items-center justify-center py-6 px-2 border rounded-lg ${
                insulation === 'poor' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⭐</span>
              <span className="font-medium">Poor</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center ">Do you have radiators?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setHasThermostats(true)}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                hasThermostats === true
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🌡️</span>
              <span className="font-medium">Yes</span>
            </button>
            <button
              onClick={() => setHasThermostats(false)}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                hasThermostats === false
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">❌</span>
              <span className="font-medium">No</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-row justify-between mt-10 space-x-3 mb-8">
        <button
          onClick={previousStep}
          className="w-[20%] bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-2 rounded-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          disabled={!insulation || hasThermostats === null}
          className={`w-[80%] font-medium py-3 px-3 rounded-md flex items-center justify-center group transition-colors ${
            insulation && hasThermostats !== null
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next step
          <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${insulation && hasThermostats !== null ? 'group-hover:translate-x-1 text-white' : 'text-gray-500'}`} />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  const renderStep3 = () => (
    <div className="bg-gray-100 p-6 sm:p-8 rounded-lg mb-6">
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-6 uppercase">
        Step Three
        <span className="block text-sm text-gray-500">(of four)</span>
      </h2>
      
      <div className="space-y-10">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">How do you heat your house?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setHeatingType('gas')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                heatingType === 'gas' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🔥</span>
              <span className="font-medium">Gas</span>
            </button>
            <button
              onClick={() => setHeatingType('electric')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                heatingType === 'electric' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⚡</span>
              <span className="font-medium">Electric</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">How do you heat your water?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setWaterHeatingType('gas')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                waterHeatingType === 'gas' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🔥</span>
              <span className="font-medium">Gas</span>
            </button>
            <button
              onClick={() => setWaterHeatingType('electric')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                waterHeatingType === 'electric' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⚡</span>
              <span className="font-medium">Electric</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4 text-center">How do you cook?</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setCookingType('gas')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                cookingType === 'gas' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">🔥</span>
              <span className="font-medium">Gas</span>
            </button>
            <button
              onClick={() => setCookingType('electric')}
              className={`flex flex-col items-center justify-center py-6 px-4 border rounded-lg ${
                cookingType === 'electric' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2">⚡</span>
              <span className="font-medium">Electric</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-row justify-between mt-10 space-x-3 mb-8">
        <button
          onClick={previousStep}
          className="w-[20%] bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 px-2 rounded-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          disabled={!heatingType || !waterHeatingType || !cookingType}
          className={`w-[80%] font-medium py-3 px-3 rounded-md flex items-center justify-center group transition-colors ${
            heatingType && waterHeatingType && cookingType
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Calculate
          <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${heatingType && waterHeatingType && cookingType ? 'group-hover:translate-x-1 text-white' : 'text-gray-500'}`} />
        </button>
      </div>

      <ProgressBar />
    </div>
  );

  const renderResultsStep = () => (
    <div className="bg-gray-100 p-6 sm:p-8 rounded-lg mb-6">
      <h2 className="text-3xl text-purple-600 font-semibold text-center mb-6 uppercase">
        Your Results
        <span className="block text-sm text-gray-500">(step four of four)</span>
      </h2>
      
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h3 className="text-xl font-semibold text-center mb-6">Estimated Monthly Energy Costs</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <span className="text-blue-600 text-4xl font-bold">£{totalEstimate.electric}</span>
            <p className="mt-2 text-gray-600">Electricity</p>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-lg text-center">
            <span className="text-amber-600 text-4xl font-bold">£{totalEstimate.gas}</span>
            <p className="mt-2 text-gray-600">Gas</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <span className="text-purple-600 text-4xl font-bold">£{totalEstimate.total}</span>
            <p className="mt-2 text-gray-600">Total per month</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="font-semibold mb-3 text-center">Yearly Estimate</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-600">Yearly total: <span className="font-semibold">£{totalEstimate.total * 12}</span></p>
              <p className="text-gray-600">Per person monthly: <span className="font-semibold">£{Math.round(totalEstimate.total / occupants)}</span></p>
            </div>
            <div>
              <p className="text-gray-600">Average winter month: <span className="font-semibold">£{Math.round(totalEstimate.total * 1.3)}</span></p>
              <p className="text-gray-600">Average summer month: <span className="font-semibold">£{Math.round(totalEstimate.total * 0.7)}</span></p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-center">Energy Saving Tips</h3>
        
        <ul className="space-y-2 mb-6 text-center">
          <li className="flex items-start text-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-center">Turn your thermostat down by 1°C to save up to 10% on your heating bill</span>
          </li>
          <li className="flex items-start text-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-center">Use LED bulbs instead of traditional ones to save up to 90% on lighting costs</span>
          </li>
          <li className="flex items-start text-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-center">Air dry clothes when possible instead of using a tumble dryer</span>
          </li>
          <li className="flex items-start text-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-center">Turn off appliances at the wall rather than leaving them on standby</span>
          </li>
          <li className="flex items-start text-center">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-center">Only fill the kettle with the amount of water you need</span>
          </li>
        </ul>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Note: This is an estimate based on your inputs and average UK energy prices.</p>
          <p className="text-sm text-gray-500">Actual costs may vary depending on your specific energy tariff and usage patterns.</p>
        </div>
      </div>
      
      <div className="mt-8 text-center mb-8">
        <button
          onClick={() => {
            setCurrentStep(1);
            setIsCalculationComplete(false);
          }}
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
        <title>{t('tools.energy.title')} | Lboro Move</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
      </Head>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="sm:text-4xl text-2xl font-bold mb-4 mt-20 uppercase">
            ⚡ Energy Cost Estimator
          </h1>
          <p className="text-gray-600 sm:text-lg text-md max-w-2xl mx-auto lowercase">
            Calculate your monthly energy costs based on your accommodation and usage
          </p>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderResultsStep()}
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