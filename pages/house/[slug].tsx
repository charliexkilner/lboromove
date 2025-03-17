import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Property } from '../../types/property';
import PropertyModal from '@/components/PropertyModal';
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
import { getPropertyIdFromSlug } from '@/utils/url';

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

export default function PropertyPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return null;

  return (
    <PropertyModal
      slug={slug as string}
      onClose={() => {
        router.push('/', undefined, { shallow: true });
      }}
    />
  );
}

export async function getServerSideProps({ params }: { params: { slug: string } }) {
  if (!params?.slug) {
    return { notFound: true };
  }

  const id = getPropertyIdFromSlug(params.slug);
  
  // Determine the base URL - use environment variable or fallback to localhost
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Pre-fetch the property data
  try {
    const res = await fetch(`${baseUrl}/api/properties/${id}`);
    
    if (!res.ok) {
      console.error(`Failed to fetch property data: ${res.status} ${res.statusText}`);
      return { notFound: true };
    }
    
    const propertyData = await res.json();
    
    return {
      props: {
        fallback: {
          [`/api/properties/${id}`]: propertyData,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching property data:', error);
    return { notFound: true };
  }
}
