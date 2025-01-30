import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Property } from '../../types/property';
import PropertyModal from '../../components/PropertyModal';
import Navbar from '../../components/Navbar';

interface PropertyPageProps {
  property: Property;
}

// Add loading skeleton component
function PropertyModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-black md:bg-opacity-50">
      <div className="animate-pulse bg-gray-200 w-full h-screen md:h-[90vh] md:w-[90vw] md:max-w-6xl md:mx-auto md:my-[5vh] md:rounded-lg"></div>
    </div>
  );
}

export default function PropertyPage({
  property: initialProperty,
}: PropertyPageProps) {
  const router = useRouter();
  const { slug } = router.query;

  // Extract ID from the end of the slug
  const id = slug ? (slug as string).split('-').pop() : null;

  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['property', router.asPath],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      return res.json();
    },
    enabled: !!id,
    initialData: initialProperty,
    staleTime: 1000 * 60,
  });

  // Rest of the component...
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale,
}) => {
  try {
    if (!params?.slug) {
      return { notFound: true };
    }

    // Extract ID from the end of the slug
    const id = (params.slug as string).split('-').pop();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`
    );

    if (!response.ok) {
      return { notFound: true };
    }

    const property = await response.json();

    return {
      props: {
        property,
        ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return { notFound: true };
  }
};
