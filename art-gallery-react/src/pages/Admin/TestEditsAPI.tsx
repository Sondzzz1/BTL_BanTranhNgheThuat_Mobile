import React, { useState } from 'react';
import apiClient from '../../services/api';

const TestEditsAPI: React.FC = () => {
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const testAPI = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        
        try {
            console.log('Testing API: /admin/tac-pham-chinh-sua');
            console.log('Base URL:', apiClient.defaults.baseURL);
            console.log('Full URL:', `${apiClient.defaults.baseURL}/admin/tac-pham-chinh-sua`);
            
            const response = await apiClient.get('/admin/tac-pham-chinh-sua');
            console.log('API Response:', response);
            setResult(response.data);
        } catch (err: any) {
            console.error('API Error:', err);
            console.error('Error config:', err.config);
            console.error('Error response:', err.response);
            setError(
                `Status: ${err.response?.status || 'N/A'}\n` +
                `Message: ${err.response?.data?.message || err.message || 'Unknown error'}\n` +
                `URL: ${err.config?.url || 'N/A'}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Test API: /admin/tac-pham-chinh-sua</h2>
            
            <button 
                onClick={testAPI} 
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: '#ff7b00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                {loading ? 'Loading...' : 'Test API'}
            </button>

            {error && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: '#ffebee', 
                    color: '#c62828',
                    borderRadius: '5px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Result:</h3>
                    <div style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '15px', 
                        borderRadius: '5px',
                        overflow: 'auto'
                    }}>
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                    </div>
                    <p><strong>Total items:</strong> {Array.isArray(result) ? result.length : 'Not an array'}</p>
                </div>
            )}
        </div>
    );
};

export default TestEditsAPI;
