import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Property } from '../../types/property';
import PropertyModal from '../../components/PropertyModal';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PropertyMap from '../../components/PropertyMap';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import FullScreenGallery from '../../components/FullScreenGallery';

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
  const { t, i18n } = useTranslation('common');
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

  const [isMobile, setIsMobile] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showFullGallery, setShowFullGallery] = useState(false);

  const closeModal = () => {
    router.push('/', undefined, { shallow: true });
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('📋 Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast(
      <div className="flex items-center gap-2">
        <span>❤️ Added to favorites - </span>
        <a href="/favorites" className="underline hover:text-purple-600">
          View favorites
        </a>
      </div>
    );
  };

  const nextImage = () => {
    if (propertyData?.images) {
      setCurrentImageIndex((prev) =>
        prev === propertyData.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (propertyData?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? propertyData.images.length - 1 : prev - 1
      );
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If accessed directly, render the full page
  // If accessed via modal, the index page will handle it
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      !document.referrer.includes(window.location.host)
    ) {
      // Accessed directly - keep as full page
      return;
    }
    // Accessed from within site - redirect to home with modal
    router.replace('/', undefined, { shallow: true });
  }, [router]);

  if (isLoading) {
    return <PropertyModalSkeleton />;
  }

  return (
    <PropertyModal
      slug={router.query.slug as string}
      onClose={() => router.push('/')}
    />
  );
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
