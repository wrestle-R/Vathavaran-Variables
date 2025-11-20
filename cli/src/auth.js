import Conf from 'conf';

const config = new Conf({ projectName: 'vathavaran-cli' });

export function saveAuth(userId, userName, token) {
  config.set('userId', parseInt(userId)); // Store as number
  config.set('userName', userName);
  config.set('token', token);
}

export function getAuth() {
  const userId = config.get('userId');
  const userName = config.get('userName');
  const token = config.get('token');
  
  if (!userId) {
    return null;
  }
  
  return { userId, userName, token };
}

export function clearAuth() {
  config.delete('userId');
  config.delete('userName');
  config.delete('token');
}

export function isAuthenticated() {
  return !!getAuth();
}
