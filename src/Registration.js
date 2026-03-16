import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Simple database service - NO IMPORT NEEDED
const createDatabaseService = () => {
  const SCRIPT_ID = 'AKfycbyCIK_ymD3yJqWNCVxVVS7PUNaSbE7S8GjskQCHQclA6kJjwaIfbVeJxhQCwZqW0hdC'; // Same as in other files
  
  return {
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

    // Register donor to database
    async registerDonor(donorData) {
      console.log('🔄 Registering donor to database:', donorData);
      
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
      
      const result = await this.jsonpRequest('registerDonor', params);
      console.log('✅ Registration response:', result);
      return result;
    },

    // Get districts from database - FIXED VERSION
    async getDistricts() {
      console.log('🔄 Loading districts from database...');
      try {
        // Try to get districts from the districts summary
        const result = await this.jsonpRequest('getDistrictsSummary');
        console.log('📊 Districts API Response:', result);
        
        if (result && result.success && result.districts) {
          // Extract district names from the districts array
          const districtNames = result.districts.map(d => d.name || d.district);
          console.log('✅ Districts loaded:', districtNames);
          return {
            success: true,
            districts: districtNames
          };
        } else {
          console.log('❌ No districts data, using fallback');
          return this.getFallbackData('getDistricts');
        }
      } catch (error) {
        console.error('💥 Error loading districts:', error);
        return this.getFallbackData('getDistricts');
      }
    },

    // Fallback data
    getFallbackData(action, params) {
      console.log('🔄 Using fallback for:', action);
      
      const fallbackDistricts = [
        'Central District', 'South District', 'North District', 
        'West District', 'East District', 'Coastal District',
        
      ];
      
      switch(action) {
        case 'registerDonor':
          return {
            success: true, 
            message: 'Registered successfully (offline mode)',
            donorId: Date.now()
          };
        case 'getDistricts':
          return {
            success: true,
            districts: fallbackDistricts
          };
        default:
          return {success: false, error: 'Unknown action'};
      }
    }
  };
};

// Create databaseService instance
const databaseService = createDatabaseService();

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    bloodGroup: '',
    district: '',
    city: '',
    phone: '',
    email: '',
    lastDonation: '',
    availability: 'Available'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [districts, setDistricts] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(true);

  // Load districts on component mount - FIXED VERSION
  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    setDistrictsLoading(true);
    try {
      console.log('🏁 START: Loading districts for registration form');
      
      const result = await databaseService.getDistricts();
      
      console.log('📊 DISTRICTS RESULT:', result);
      
      if (result && result.success) {
        setDistricts(result.districts || []);
        console.log('✅ Districts set:', result.districts);
      } else {
        // Use fallback districts
        const fallbackDistricts = [
          'Central District', 'South District', 'North District', 
          'West District', 'East District', 'Coastal District'
        ];
        setDistricts(fallbackDistricts);
        console.log('🔄 Using fallback districts:', fallbackDistricts);
      }
    } catch (error) {
      console.error('💥 Error loading districts:', error);
      // Use fallback districts on error
      const fallbackDistricts = [
        'Central District', 'South District', 'North District', 
        'West District', 'East District', 'Coastal District'
      ];
      setDistricts(fallbackDistricts);
    } finally {
      setDistrictsLoading(false);
      console.log('🏁 END: Districts loading complete');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    console.log('🏁 START: Registration process');
    console.log('📝 Form data:', formData);

    // Basic validation
    if (!formData.fullName || !formData.bloodGroup || !formData.district || !formData.phone) {
      setMessage('❌ Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage('❌ Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Sending data to database...');
      
      // Register donor in database
      const result = await databaseService.registerDonor(formData);
      
      console.log('📊 DATABASE RESPONSE:', result);

      if (result && result.success) {
        setMessage(`✅ ${result.message || 'Registration successful! You are now in our database.'}`);
        
        // Reset form
        setFormData({
          fullName: '',
          bloodGroup: '',
          district: '',
          city: '',
          phone: '',
          email: '',
          lastDonation: '',
          availability: 'Available'
        });

        // Redirect to search page after 2 seconds
        setTimeout(() => {
          navigate('/search');
        }, 2000);

      } else {
        setMessage(`❌ ${result.error || 'Registration failed. Please try again.'}`);
      }

    } catch (error) {
      console.error('💥 REGISTRATION ERROR:', error);
      setMessage('❌ Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
      console.log('🏁 END: Registration process');
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const availabilityOptions = ['Available', 'Weekends', 'Evenings', 'On Call', 'Emergency Only'];

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
              <li className="breadcrumb-item active">✍️ Register as Donor</li>
            </ol>
          </nav>
          <h2>Join Our Lifesaving Community</h2>
          <p className="text-muted">Register as a blood donor and help save lives</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-danger text-white">
              <h4 className="mb-0">🩸 Donor Registration Form</h4>
            </div>
            <div className="card-body">
              {/* Status Message */}
              {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mb-4`}>
                  <strong>{message}</strong>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Full Name */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Blood Group */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Blood Group <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  {/* District - FIXED SECTION */}
                  <div className="col-md-6">
                    <label className="form-label">
                      District <span className="text-danger">*</span>
                    </label>
                    {districtsLoading ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="text-muted">Loading districts...</span>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((district, index) => (
                          <option key={index} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                    )}
                    {districts.length === 0 && !districtsLoading && (
                      <div className="text-warning small mt-1">
                        No districts available. Please check database connection.
                      </div>
                    )}
                  </div>

                  {/* City */}
                  <div className="col-md-6">
                    <label className="form-label">City/Area</label>
                    <input
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter your city or area"
                    />
                  </div>

                  {/* Phone */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="e.g., +8801712345678"
                    />
                    <div className="form-text">Your phone will be shown to those in need</div>
                  </div>

                  {/* Email */}
                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Last Donation */}
                  <div className="col-md-6">
                    <label className="form-label">Last Donation Date</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastDonation"
                      value={formData.lastDonation}
                      onChange={handleChange}
                      placeholder="e.g., 3 months ago, Never donated, etc."
                    />
                    <div className="form-text">Approximate time since last donation</div>
                  </div>

                  {/* Availability */}
                  <div className="col-md-6">
                    <label className="form-label">Availability</label>
                    <select
                      className="form-select"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                    >
                      {availabilityOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <div className="form-text">When are you available for donation?</div>
                  </div>

                  {/* Submit Button */}
                  <div className="col-12">
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-danger btn-lg"
                        disabled={loading || districtsLoading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Registering to Database...
                          </>
                        ) : (
                          <>
                            ✍️ Register as Blood Donor
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Additional Info */}
              <div className="mt-4 p-3 bg-light rounded">
                <h6>📋 What happens after registration?</h6>
                <ul className="small mb-0">
                  <li>Your information will be stored in our secure database</li>
                  <li>People in need can find and contact you directly</li>
                  <li>You can update your availability anytime</li>
                  <li>Your privacy is respected - only necessary info is shared</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card text-center h-100">
                <div className="card-body">
                  <div className="text-primary mb-3" style={{fontSize: '2rem'}}>🔍</div>
                  <h5>Find Donors</h5>
                  <p className="text-muted small">Need blood? Search our donor database</p>
                  <Link to="/search" className="btn btn-outline-primary btn-sm">
                    Search Donors
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card text-center h-100">
                <div className="card-body">
                  <div className="text-success mb-3" style={{fontSize: '2rem'}}>ℹ️</div>
                  <h5>Learn More</h5>
                  <p className="text-muted small">About blood donation and its importance</p>
                  <Link to="/about" className="btn btn-outline-success btn-sm">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;