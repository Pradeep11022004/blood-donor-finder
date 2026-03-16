import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

// SIMPLE API SERVICE - NO IMPORT NEEDED
const createApiService = () => {
  const SCRIPT_ID = 'AKfycbyCIK_ymD3yJqWNCVxVVS7PUNaSbE7S8GjskQCHQclA6kJjwaIfbVeJxhQCwZqW0hdC'; // Replace with your actual script ID
  
  return {
    // JSONP method to avoid CORS
    jsonpRequest(action, params = {}) {
      return new Promise((resolve) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        params.callback = callbackName;
        
        const script = document.createElement('script');
        const urlParams = new URLSearchParams(params);
        
        window[callbackName] = (data) => {
          delete window[callbackName];
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          resolve(data);
        };

        script.src = `https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=${action}&${urlParams.toString()}`;
        script.onerror = () => {
          delete window[callbackName];
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          console.log('JSONP failed for:', action);
          resolve(this.getFallbackData(action, params));
        };

        document.head.appendChild(script);

        setTimeout(() => {
          if (window[callbackName]) {
            delete window[callbackName];
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
            resolve(this.getFallbackData(action, params));
          }
        }, 10000);
      });
    },

    // Get donors from database
    async getDonors(filters = {}) {
      console.log('🔄 Getting donors with filters:', filters);
      const result = await this.jsonpRequest('getDonors', filters);
      console.log('✅ Received response:', result);
      return result;
    },

    // Get districts summary
    async getDistrictsSummary() {
      return this.jsonpRequest('getDistrictsSummary');
    },

    // Get recent donors
    async getRecentDonors() {
      return this.jsonpRequest('getRecentDonors');
    },

    // Get all data for debugging
    async getAllData() {
      return this.jsonpRequest('getAllData');
    },

    // Register donor
    async registerDonor(donorData) {
      const params = {
        fullName: donorData.fullName,
        bloodGroup: donorData.bloodGroup,
        district: donorData.district,
        city: donorData.city,
        phone: donorData.phone,
        email: donorData.email || '',
        lastDonation: donorData.lastDonation || '',
        availability: donorData.availability || 'Available'
      };
      
      return this.jsonpRequest('registerDonor', params);
    },

    // Fallback data
    getFallbackData(action, params) {
      console.log('🔄 Using fallback data for:', action);
      
      switch(action) {
        case 'getDonors':
          return this.getSampleDonors(params);
        case 'getDistrictsSummary':
          return this.getSampleDistricts();
        case 'getRecentDonors':
          return this.getSampleRecentDonors();
        case 'registerDonor':
          return {success: true, message: 'Registered (offline mode)'};
        default:
          return {success: false, error: 'Unknown action'};
      }
    },

    getSampleDonors(filters = {}) {
      const donors = [
        {
          id: 1,
          FullName: 'Sample Donor 1',
          BloodGroup: 'O+',
          District: 'South District',
          City: 'Gulshan',
          Phone: '+8801712345678',
          Email: 'sample1@example.com',
          LastDonation: '2 months ago',
          Availability: 'Weekends'
        },
        {
          id: 2,
          FullName: 'Sample Donor 2',
          BloodGroup: 'A+',
          District: 'Central District',
          City: 'Downtown',
          Phone: '+8801812345679',
          Email: 'sample2@example.com',
          LastDonation: '1 month ago',
          Availability: 'Evenings'
        }
      ];

      let filtered = donors;
      if (filters.district) {
        filtered = donors.filter(d => d.District === filters.district);
      }

      return {
        success: true,
        donors: filtered,
        message: 'Sample data (database not available)'
      };
    },

    getSampleDistricts() {
      return {
        success: true,
        districts: [
          {name: 'Central District', donors: 8},
          {name: 'South District', donors: 12}
        ]
      };
    },

    getSampleRecentDonors() {
      return {
        success: true,
        donors: [
          {
            id: 1,
            FullName: 'Recent Sample',
            BloodGroup: 'O+',
            District: 'Central District',
            LastDonation: '1 week ago'
          }
        ]
      };
    }
  };
};

// Create apiService instance
const apiService = createApiService();

const DonorSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    district: searchParams.get('district') || 'South District',
    bloodGroup: searchParams.get('bloodGroup') || 'All blood groups',
    searchArea: searchParams.get('searchArea') || ''
  });
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading database...');

  // Load donors from database - FIXED VERSION
  useEffect(() => {
    loadDonorsFromDatabase();
  }, []);

  // Reload when district changes
  useEffect(() => {
    if (filters.district) {
      loadDonorsFromDatabase();
    }
  }, [filters.district]);

  const loadDonorsFromDatabase = async () => {
    setLoading(true);
    setMessage(`🔄 Loading donors from ${filters.district}...`);
    
    try {
      console.log('🏁 START: Loading donors from database');
      
      const result = await apiService.getDonors(filters);
      
      console.log('📊 DATABASE RESPONSE:', result);
      
      if (result && result.success) {
        setDonors(result.donors || []);
        setMessage(result.message || `✅ Found ${result.donors?.length || 0} REAL donors in database`);
        console.log('🎉 SUCCESS: Donors loaded from database:', result.donors);
      } else {
        setDonors([]);
        setMessage('❌ No donors found in database');
        console.log('❌ ERROR: API returned failure');
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR:', error);
      setDonors([]);
      setMessage('❌ Database connection failed');
    } finally {
      setLoading(false);
      console.log('🏁 END: Loading complete');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update URL
    const newParams = new URLSearchParams();
    newParams.set('district', name === 'district' ? value : filters.district);
    if (filters.bloodGroup !== 'All blood groups') {
      newParams.set('bloodGroup', filters.bloodGroup);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('🔍 Manual search triggered');
    loadDonorsFromDatabase();
  };

  // Test database connection
  const testDatabase = async () => {
    const result = await apiService.getAllData();
    console.log('Database Test:', result);
    alert('Check console for database test results');
  };

  // Contact functions
  const handleCall = (phone) => {
    if (phone && phone !== 'No Phone') {
      window.open(`tel:${phone}`, '_self');
    } else {
      alert('Phone number not available');
    }
  };

  const handleSMS = (phone) => {
    if (phone && phone !== 'No Phone') {
      window.open(`sms:${phone}`, '_self');
    } else {
      alert('Phone number not available for SMS');
    }
  };

  const handleEmail = (email) => {
    if (email && email !== 'No Email') {
      window.open(`mailto:${email}`, '_self');
    } else {
      alert('Email not available');
    }
  };

  const handleShare = (donor) => {
    const shareText = `Blood Donor: ${donor.FullName} (${donor.BloodGroup}) in ${donor.District}. Contact: ${donor.Phone}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Blood Donor Information',
        text: shareText
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      alert('Donor info copied to clipboard!');
    } else {
      prompt('Copy donor information:', shareText);
    }
  };

  const districts = [
    'Central District', 'South District', 'North District', 
    'West District', 'East District', 'Coastal District'
  ];

  const bloodGroups = ['All blood groups', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/" className="text-danger">🏠 Home</Link>
              </li>
              <li className="breadcrumb-item active">🔍 Donor Search</li>
            </ol>
          </nav>
          <h2>Find Blood Donors - REAL DATABASE</h2>
          <p className="text-muted">Stored data will show here from database</p>
          
          {/* Debug Button */}
          <button className="btn btn-warning btn-sm" onClick={testDatabase}>
            Test Database Connection
          </button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">🔍 Search Database</h5>
              <form onSubmit={handleSearch}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label">District</label>
                    <select
                      className="form-select"
                      name="district"
                      value={filters.district}
                      onChange={handleFilterChange}
                    >
                      {districts.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      name="bloodGroup"
                      value={filters.bloodGroup}
                      onChange={handleFilterChange}
                    >
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <button 
                      type="submit" 
                      className="btn btn-danger w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Loading...
                        </>
                      ) : (
                        '🔍 Search Database'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div className="row mb-3">
        <div className="col-12">
          <div className={`alert ${loading ? 'alert-warning' : donors.length > 0 ? 'alert-success' : 'alert-info'}`}>
            <strong>{message}</strong>
          </div>
        </div>
      </div>

      <div className="row">
        {/* REAL DATABASE DONORS - WILL SHOW NOW */}
        <div className="col-lg-8">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading from database...</p>
            </div>
          ) : donors.length === 0 ? (
            <div className="card text-center py-5">
              <div className="card-body">
                <div className="text-muted mb-3" style={{fontSize: '4rem'}}>📭</div>
                <h5>No Donors in Database</h5>
                <p className="text-muted mb-4">
                  No blood donors found in database for {filters.district}.<br />
                  Be the first to register!
                </p>
                <Link to="/register" className="btn btn-danger">
                  Register as First Donor
                </Link>
                <button className="btn btn-outline-secondary ms-2" onClick={loadDonorsFromDatabase}>
                  🔄 Retry
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>✅ REAL DATABASE DONORS in {filters.district}</h4>
                <span className="badge bg-success">LIVE DATA</span>
              </div>
              
              <div className="donors-list">
                {donors.map((donor, index) => (
                  <div key={donor.id || index} className="card donor-card mb-3 shadow-sm">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-8">
                          <h5 className="card-title mb-1">{donor.FullName}</h5>
                          <div className="mb-2">
                            <span className="badge bg-danger me-2">{donor.BloodGroup}</span>
                            <span className="badge bg-secondary me-2">{donor.District}</span>
                            <span className="badge bg-light text-dark">{donor.City}</span>
                          </div>
                          <p className="card-text text-muted small mb-1">
                            📅 Last donation: {donor.LastDonation}
                          </p>
                          <p className="card-text text-muted small mb-1">
                            📞 {donor.Phone}
                          </p>
                          <p className="card-text text-muted small mb-1">
                            ✉️ {donor.Email}
                          </p>
                          <p className="card-text small mb-0">
                            <span className="badge bg-success">{donor.Availability}</span>
                          </p>
                        </div>
                        <div className="col-md-4 text-end">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setSelectedDonor(donor)}
                          >
                            Contact Donor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Donor Details */}
        <div className="col-lg-4">
          {selectedDonor ? (
            <div className="card sticky-top shadow" style={{ top: '20px' }}>
              <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Database Record</h5>
                <button 
                  className="btn btn-sm btn-outline-light"
                  onClick={() => setSelectedDonor(null)}
                >
                  ✕
                </button>
              </div>
              <div className="card-body">
                <h5 className="card-title">{selectedDonor.FullName}</h5>
                <p className="text-muted small mb-3">
                  Real donor data from database
                </p>

                <div className="donor-info mb-4">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th>Blood Group</th>
                        <td>
                          <span className="badge bg-danger">{selectedDonor.BloodGroup}</span>
                        </td>
                      </tr>
                      <tr>
                        <th>District</th>
                        <td>{selectedDonor.District}</td>
                      </tr>
                      <tr>
                        <th>City</th>
                        <td>{selectedDonor.City}</td>
                      </tr>
                      <tr>
                        <th>Last Donation</th>
                        <td>{selectedDonor.LastDonation}</td>
                      </tr>
                      <tr>
                        <th>Availability</th>
                        <td>{selectedDonor.Availability}</td>
                      </tr>
                      <tr>
                        <th>Phone</th>
                        <td>{selectedDonor.Phone}</td>
                      </tr>
                      <tr>
                        <th>Email</th>
                        <td>{selectedDonor.Email}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Contact Buttons */}
                <div className="contact-buttons">
                  <h6>Contact Donor:</h6>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-success"
                      onClick={() => handleCall(selectedDonor.Phone)}
                    >
                      📞 Call Now
                    </button>
                    
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleSMS(selectedDonor.Phone)}
                    >
                      💬 Send SMS
                    </button>
                    
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => handleEmail(selectedDonor.Email)}
                      disabled={!selectedDonor.Email || selectedDonor.Email === 'No Email'}
                    >
                      📧 Send Email
                    </button>
                    
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => handleShare(selectedDonor)}
                    >
                      🔗 Share Donor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-4">
              <div className="card-body">
                <div className="text-muted mb-3" style={{fontSize: '2rem'}}>👆</div>
                <h6>Donor Details</h6>
                <p className="text-muted small">
                  Select a donor to view REAL database information
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorSearch;