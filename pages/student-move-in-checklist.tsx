import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Navbar from '../components/Navbar';
import ReactMarkdown from 'react-markdown';
import Head from 'next/head';

export default function MoveInChecklist() {
  const { t } = useTranslation('common');

  return (
    <>
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Introduction */}
            <div className="p-8 border-b border-gray-100">
              <p className="text-lg text-gray-700 leading-relaxed">
                Moving into your <strong>student home in Loughborough</strong>{' '}
                (or any university city) is{' '}
                <strong>exciting but stressful</strong>—you don't want to arrive
                and realize you've forgotten essentials like bedding, chargers,
                or kitchen supplies! That's why we've put together this{' '}
                <strong>complete student move-in checklist</strong> to make sure
                you have everything you need.
              </p>
            </div>

            {/* Essential Documents Section */}
            <div className="p-8 border-b border-gray-100 bg-gray-50">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>📌</span> Essential Documents to Bring
              </h2>
              <p className="mb-4 text-gray-700">
                Before moving in, make sure you have these{' '}
                <strong>important documents</strong> ready:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      University acceptance letter
                    </strong>
                    <p className="text-gray-600">
                      You may need this for ID checks.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Student ID & Passport
                    </strong>
                    <p className="text-gray-600">For identity verification.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Rental agreement/tenancy contract
                    </strong>
                    <p className="text-gray-600">
                      Make sure it's signed and stored safely.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Proof of address (bank letter, tenancy agreement, utility
                      bill)
                    </strong>
                    <p className="text-gray-600">Some services require this.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Emergency contact details
                    </strong>
                    <p className="text-gray-600">Just in case!</p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 bg-purple-50 p-4 rounded-lg w-200">
                <p className=" items-center gap-2 text-purple-800">
                  <strong className="text-lg">💡 LboroMove Tip:</strong>
                  <br /> Store digital copies of important documents on{' '}
                  <strong>Google Drive or Dropbox</strong> so you can access
                  them anywhere!
                </p>
              </div>
            </div>

            {/* Room & Bedroom Essentials Section */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>🏠</span> Room & Bedroom Essentials
              </h2>
              <p className="mb-6 text-gray-700">
                Your <strong>student bedroom</strong> is where you'll be
                spending a lot of time, so make sure it's comfortable.
              </p>

              <div className="space-y-8">
                {/* Bedding & Comfort Subsection */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>🛏️</span> Bedding & Comfort
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Duvet & Pillows
                        </strong>
                        <p className="text-gray-600">
                          Some student homes provide them, but it's best to
                          check.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Bedsheets & Covers
                        </strong>
                        <p className="text-gray-600">
                          At least two sets, so you have a backup.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Mattress Protector
                        </strong>
                        <p className="text-gray-600">
                          Keeps your bed clean and lasts longer.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Cushions & Throws
                        </strong>
                        <p className="text-gray-600">
                          For extra comfort and a cozy touch.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Lighting & Storage Subsection */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>💡</span> Lighting & Storage
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">Desk Lamp</strong>
                        <p className="text-gray-600">
                          Perfect for late-night study sessions.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Clothes Hangers
                        </strong>
                        <p className="text-gray-600">
                          Helps keep your wardrobe organized.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">Storage Boxes</strong>
                        <p className="text-gray-600">
                          Great for under-bed storage and saving space.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✅</span>
                      <div>
                        <strong className="text-gray-900">
                          Over-the-Door Hooks
                        </strong>
                        <p className="text-gray-600">
                          Useful for coats, towels, and bags.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Kitchen Essentials Section */}
            <div className="p-8 border-b border-gray-100 bg-gray-50">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>🍳</span> Kitchen Essentials
              </h2>
              <p className="mb-4 text-gray-700">
                Even if you're living in a shared house with a communal kitchen,
                there are <strong>some essentials</strong> you'll want to bring.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Plates, Bowls & Cutlery
                    </strong>
                    <p className="text-gray-600">
                      One set per person is usually enough.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">Mugs & Glasses</strong>
                    <p className="text-gray-600">
                      A must for tea, coffee, and water.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">Cooking Utensils</strong>
                    <p className="text-gray-600">
                      Spatula, tongs, wooden spoon, whisk - for basic cooking.
                    </p>
                  </div>
                </li>
                {/* Add remaining kitchen items */}
              </ul>
              <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                <p className="items-center gap-2 text-purple-800">
                  <strong>💡 LboroMove Tip:</strong> Buy a{' '}
                  <strong>label maker or permanent marker</strong> so your
                  flatmates don't "accidentally borrow" your kitchenware!
                </p>
              </div>
            </div>

            {/* Bathroom Essentials Section */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>🛁</span> Bathroom Essentials
              </h2>
              <p className="mb-4 text-gray-700">
                Some student houses have <strong>en-suite bathrooms</strong>,
                while others have shared bathrooms—either way, don't forget
                these essentials.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✅</span>
                  <div>
                    <strong className="text-gray-900">
                      Towels (Face, Hand & Bath)
                    </strong>
                    <p className="text-gray-600">At least two sets.</p>
                  </div>
                </li>
                {/* Add remaining bathroom items */}
              </ul>
              <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                <p className="items-center gap-2 text-purple-800">
                  <strong className="text-lg">💡 LboroMove Tip:</strong>
                  <br /> If you have a <strong>shared bathroom</strong>, get a{' '}
                  <strong>portable shower caddy</strong> to store your
                  toiletries neatly.
                </p>
              </div>
            </div>

            {/* Continue with Tech & Study Essentials, Food & Grocery Essentials, etc. */}
          </article>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};
