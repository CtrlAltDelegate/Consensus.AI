import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  Calendar, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Mock API functions (replace with actual API calls)
const fetchTokenUsage = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    tier: 'pro',
    limit: 50000,
    used: 32450,
    remaining: 17550,
    usagePercentage: 64.9,
    totalLifetime: 124530,
    lastReset: new Date('2024-01-01'),
    status: 'moderate'
  };
};

const fetchUsageHistory = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { date: '2024-01-01', tokens: 2500, requests: 12 },
    { date: '2024-01-02', tokens: 3200, requests: 15 },
    { date: '2024-01-03', tokens: 1800, requests: 8 },
    { date: '2024-01-04', tokens: 4100, requests: 18 },
    { date: '2024-01-05', tokens: 2900, requests: 13 },
    { date: '2024-01-06', tokens: 3600, requests: 16 },
    { date: '2024-01-07', tokens: 2200, requests: 10 }
  ];
};

function TokenDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const { data: usage, isLoading: usageLoading } = useQuery(
    'tokenUsage',
    fetchTokenUsage,
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  const { data: history, isLoading: historyLoading } = useQuery(
    ['usageHistory', selectedPeriod],
    fetchUsageHistory
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'low': return 'success';
      case 'moderate': return 'primary';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      case 'exceeded': return 'error';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'low':
      case 'moderate':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'exceeded':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const pieData = usage ? [
    { name: 'Used', value: usage.used, color: '#3b82f6' },
    { name: 'Remaining', value: usage.remaining, color: '#e5e7eb' }
  ] : [];

  return (
    <div className="container-wide space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Token Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor your token usage and manage your subscription
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="form-input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UsageCard
          title="Current Usage"
          value={usage ? `${usage.used.toLocaleString()}` : '--'}
          subtitle={usage ? `of ${usage.limit.toLocaleString()} tokens` : 'Loading...'}
          icon={<Zap className="w-6 h-6" />}
          color="primary"
          loading={usageLoading}
        />
        
        <UsageCard
          title="Remaining Tokens"
          value={usage ? `${usage.remaining.toLocaleString()}` : '--'}
          subtitle={usage ? `${(100 - usage.usagePercentage).toFixed(1)}% available` : 'Loading...'}
          icon={<TrendingUp className="w-6 h-6" />}
          color="success"
          loading={usageLoading}
        />
        
        <UsageCard
          title="Subscription Tier"
          value={usage ? usage.tier.toUpperCase() : '--'}
          subtitle="Current plan"
          icon={getStatusIcon(usage?.status)}
          color={getStatusColor(usage?.status)}
          loading={usageLoading}
        />
        
        <UsageCard
          title="Next Reset"
          value="24 days"
          subtitle="Jan 1, 2024"
          icon={<Calendar className="w-6 h-6" />}
          color="gray"
          loading={usageLoading}
        />
      </div>

      {/* Usage Progress */}
      {usage && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Token Usage Progress
              </h3>
              <span className={`badge badge-${getStatusColor(usage.status)}`}>
                {usage.status.charAt(0).toUpperCase() + usage.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {usage.used.toLocaleString()} / {usage.limit.toLocaleString()} tokens
                </span>
                <span className="font-medium">
                  {usage.usagePercentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="progress">
                <div
                  className={`progress-${getStatusColor(usage.status)}`}
                  style={{ width: `${Math.min(usage.usagePercentage, 100)}%` }}
                />
              </div>
              
              {usage.usagePercentage > 75 && (
                <div className="flex items-center mt-3 p-3 bg-warning-50 border border-warning-200 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-warning-600 mr-2" />
                  <div className="text-sm">
                    <p className="text-warning-800 font-medium">
                      High Usage Alert
                    </p>
                    <p className="text-warning-700">
                      You've used {usage.usagePercentage.toFixed(1)}% of your monthly tokens. 
                      Consider upgrading your plan to avoid overage charges.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Token Usage
            </h3>
            
            {historyLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="spinner w-8 h-8" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      `${value.toLocaleString()} ${name}`, 
                      name === 'tokens' ? 'Tokens' : 'Requests'
                    ]}
                  />
                  <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Usage Distribution */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Usage Distribution
            </h3>
            
            {usageLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="spinner w-8 h-8" />
              </div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} tokens`} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full mr-2" />
                      <span>Used</span>
                    </div>
                    <span className="font-medium">
                      {usage?.used.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-2" />
                      <span>Remaining</span>
                    </div>
                    <span className="font-medium">
                      {usage?.remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Usage Card Component
function UsageCard({ title, value, subtitle, icon, color, loading }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            {loading ? (
              <div className="skeleton h-8 w-24 mb-2" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
            )}
            {loading ? (
              <div className="skeleton h-4 w-32" />
            ) : (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenDashboard; 