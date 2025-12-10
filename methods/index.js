import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MenuLogo2 from '../../assets/images/logos/vc2.png';
import LoginBack from '../../assets/images/bg/login-bg2.png';
import "../scss/_login.scss";
import axios from 'axios';
import { AuthContext } from '../../context/usercontext.tsx';
import { BASE_URL } from "../../config.js";


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState('');
  const [message, setMessage] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpPhone, setFpPhone] = useState('');
  const [fpNote, setFpNote] = useState('');
  const [fpStatus, setFpStatus] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // API'den hr_offices listesini çek
    const fetchOffices = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/hr_offices`);
        setOffices(res.data);

        // Eğer liste doluysa ilkini seçili yap
        if (res.data.length > 0) {
          setSelectedOffice(res.data[0].id);
        }
      } catch (error) {
        console.error('Ofisler çekilirken hata:', error);
      }
    };

    fetchOffices();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (username === '' || password === '') {
      setMessage('Kullanıcı adı ve şifre gereklidir');
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        username,
        password,
        office_id: selectedOffice,
      });

      setMessage(`Giriş başarılı: ${response.data.message}`);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userid', response.data.userid);
      localStorage.setItem('off_id', response.data.off_id);

      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      login({
        token: response.data.token,
        username: response.data.username,
        userid: response.data.userid,
        userRole: response.data.userRole,
        offId: response.data.off_id
      });

      navigate('/');

    } catch (error) {
      localStorage.setItem('token', '');
      if (error.response) {
        setMessage(`Hata: ${error.response.data.error}`);
      } else {
        setMessage('Bir hata oluştu');
      }
      console.error('Error:', error);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpStatus('');
    try {
      await axios.post(`${BASE_URL}/forgot-password-request`, {
        email: fpEmail,
        phone: fpPhone,
        note: fpNote,
      });
      setFpStatus('Talebiniz alındı. Kısa sürede dönüş yapılacaktır.');
      setFpEmail('');
      setFpPhone('');
      setFpNote('');
      setTimeout(() => setForgotOpen(false), 1200);
    } catch (error) {
      console.error('Forgot password request error:', error);
      setFpStatus('Gönderilemedi, lütfen daha sonra tekrar deneyin.');
    }
  };

  return (
    <div className='maindiv'>
      <div className='altdiv'>
        <div className='altdiv2'>
          <div className='imagediv'>
            <div className='alt-image-div'>
              <img src={LoginBack} alt="Background" className='alt-image' />
            </div>
          </div>
          <div className='form-div'>
            <div className='form-image-div'>
              <div className='alt-form-image.div'>
                <img src={MenuLogo2} alt="Logo" className='form-image' />
              </div>
              <Typography variant="h4" component="h1" gutterBottom>
                Hoşgeldiniz!
              </Typography>
              <form className='form' onSubmit={handleLogin}>

                {/* Office select box */}
                <FormControl fullWidth margin="normal" required sx={{ minWidth: 240 }}>
                  <InputLabel id="office-select-label">Ofis Seçin</InputLabel>
                  <Select
                    labelId="office-select-label"
                    value={selectedOffice}
                    label="Ofis Seçin"
                    onChange={e => setSelectedOffice(e.target.value)}
                  >
                    {offices.map(office => (
                      <MenuItem key={office.id} value={office.id}>
                        {office.name || `Ofis #${office.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Kullanıcı Adı"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                  label="Şifre"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  style={{ marginTop: '16px' }}
                  className='login'
                  type="submit"
                >
                  GİRİŞ
                </Button>
              </form>
              {message && <Typography color="error" style={{ marginTop: '16px' }}>{message}</Typography>}

              <div className='forgot-password-div'>
                 <Button variant="text" size="small" onClick={() => setForgotOpen(true)} style={{ color: '#59018b', textTransform: 'none', fontWeight: 600 }}>
                  Şifremi Unuttum
                 </Button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #59018b 0%, #7a1fa8 100%)',
          color: '#fff',
          fontWeight: 700
        }}>
          Şifre Sıfırlama Talebi
        </DialogTitle>
        <DialogContent dividers sx={{ padding: '20px 24px', background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
          <Typography sx={{ color: '#4b5563', mb: 2 }}>
            Lütfen kayıtlı e-posta adresinizi ve iletişim numaranızı girin. Talebiniz ekibimize iletilecek.
          </Typography>
          <form id="forgot-form" onSubmit={handleForgotSubmit} style={{ display: 'grid', gap: '14px' }}>
            <TextField
              label="E-Posta"
              type="email"
              fullWidth
              required
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
            />
            <TextField
              label="Telefon (opsiyonel)"
              fullWidth
              value={fpPhone}
              onChange={(e) => setFpPhone(e.target.value)}
            />
            <TextField
              label="Not (opsiyonel)"
              multiline
              minRows={3}
              fullWidth
              value={fpNote}
              onChange={(e) => setFpNote(e.target.value)}
            />
            {fpStatus && (
              <Typography sx={{ color: '#2563eb', fontWeight: 600 }}>
                {fpStatus}
              </Typography>
            )}
          </form>
        </DialogContent>
        <DialogActions sx={{ padding: '12px 16px' }}>
          <Button onClick={() => setForgotOpen(false)} color="inherit">İptal</Button>
          <Button type="submit" form="forgot-form" variant="contained" sx={{ background: '#59018b' }}>
            Talep Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;
