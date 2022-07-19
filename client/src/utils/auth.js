/* 

Book Search Engine
auth.js
AuthService is a class of functions that decode authentication tokens and manages them in local storage

*/

import decode from 'jwt-decode';

class AuthService {
  // decodes jwt
  getProfile() {
    return decode(this.getToken());
  }

  // returns true if authenticated
  loggedIn() {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // returns true if token invalid
  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem('id_token');
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  // get token from local storage
  getToken() {
    return localStorage.getItem('id_token');
  }

  // set token into local storage, and refresh
  login(idToken) {
    localStorage.setItem('id_token', idToken);
    window.location.assign('/');
  }

  // remove token from local storage, and refresh
  logout() {
    localStorage.removeItem('id_token');
    window.location.assign('/');
  }
}

export default new AuthService();
