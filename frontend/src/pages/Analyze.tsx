import Dashboard from '../components/Dashboard';

export default function Analyze() {
  return (
    <Dashboard autoRefresh={true} refreshInterval={10000} />
  );
}
