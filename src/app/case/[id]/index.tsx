import { useLocalSearchParams } from 'expo-router';
import { CaseDetail } from '@/components/CaseDetail';
import { Screen } from '@/ui';

export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen title="">
      <CaseDetail id={id} />
    </Screen>
  );
}
