import type { MetaFunction } from 'react-router';
import { CreateListingDemo } from '~/components/demo/CreateListingDemo';

export const meta: MetaFunction = () => {
  return [
    { title: 'Create Listing Demo - Platforma Mașini Second-Hand' },
    { name: 'description', content: 'Demo pentru wizard-ul de creare anunțuri' },
  ];
};

export default function CreateListingDemoPage() {
  return <CreateListingDemo />;
}