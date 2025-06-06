import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CreditCard, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Logado com sucesso!');
    } catch (error) {
      toast.error('Email ou senha inválidos!');
      console.log({ error })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <CreditCard className="h-12 w-12 text-primary" />
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">PayLink</h1>
          <p className="mt-2 text-gray-600">Sign in to manage your payment links</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />

              <Input
                label="Password"
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Sign In
                </Button>
              </div>

              {/* <div className="text-sm text-center text-gray-500 space-y-1">
                <p>Demo credentials:</p>
                <p>Admin: admin@example.com / admin123</p>
                <p>User: demo@example.com / password</p>
              </div> */}
            </form>
          </CardContent>

          {/* <CardFooter className="flex justify-center border-t p-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter> */}
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;