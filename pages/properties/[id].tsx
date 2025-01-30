import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import React from 'react';
import HouseDetailsModal from '../../components/HouseDetailsModal';

export default function PropertyPage() {
  const router = useRouter();

  // Redirect to home page if accessed directly
  useEffect(() => {
    router.push('/');
  }, []);

  return (
    <div>
      <div>Redirecting...</div>
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
