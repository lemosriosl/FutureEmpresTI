import { EquipmentDetail } from '@/components/equipment-detail';

export default async function EquipmentPage({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  return <EquipmentDetail patrimonio={patrimonio} />;
}
