import AuthForm from '@/components/AuthForm'

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Welcome to Ecommerce</h1>
        <AuthForm />
      </div>
    </div>
  )
}