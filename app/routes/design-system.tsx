import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Badge, 
  Modal 
} from '~/components/ui';

export default function DesignSystem() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Design System
          </h1>
          <p className="text-lg text-gray-600">
            Platforma Mașini Second-Hand - Component Library
          </p>
        </motion.div>

        {/* Color Palette */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Primary Colors</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className={`w-16 h-16 rounded-lg bg-primary-${shade} border border-gray-200`}
                    />
                    <p className="text-xs text-gray-600 mt-1">{shade}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Secondary Colors</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className={`w-16 h-16 rounded-lg bg-secondary-${shade} border border-gray-200`}
                    />
                    <p className="text-xs text-gray-600 mt-1">{shade}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Typography */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Typography</h2>
          <Card>
            <CardContent className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Heading 1 - Inter Bold</h1>
                <p className="text-sm text-gray-500">text-4xl font-bold</p>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">Heading 2 - Inter Semibold</h2>
                <p className="text-sm text-gray-500">text-3xl font-semibold</p>
              </div>
              <div>
                <h3 className="text-2xl font-medium text-gray-900">Heading 3 - Inter Medium</h3>
                <p className="text-sm text-gray-500">text-2xl font-medium</p>
              </div>
              <div>
                <p className="text-base text-gray-900">Body text - Inter Regular</p>
                <p className="text-sm text-gray-500">text-base</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Small text - Inter Regular</p>
                <p className="text-xs text-gray-500">text-sm</p>
              </div>
              <div>
                <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  Code text - JetBrains Mono
                </code>
                <p className="text-sm text-gray-500">font-mono text-sm</p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Buttons */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
                <CardDescription>Different button styles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sizes</CardTitle>
                <CardDescription>Different button sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>States</CardTitle>
                <CardDescription>Button states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button>Normal</Button>
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Inputs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Inputs</CardTitle>
                <CardDescription>Standard input variations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  label="Email" 
                  placeholder="Enter your email"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input 
                  label="Password" 
                  type="password" 
                  placeholder="Enter your password"
                  helperText="Must be at least 8 characters"
                />
                <Input 
                  label="Error State" 
                  placeholder="This has an error"
                  error="This field is required"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>With Icons</CardTitle>
                <CardDescription>Inputs with left and right icons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                  label="Search" 
                  placeholder="Search cars..."
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <Input 
                  label="Price" 
                  placeholder="0"
                  rightIcon={
                    <span className="text-sm font-medium">RON</span>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with border</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This is a default card with basic styling.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This card has a subtle shadow for elevation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="outlined" hoverable>
              <CardHeader>
                <CardTitle>Hoverable Card</CardTitle>
                <CardDescription>Interactive card with hover effects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Hover over this card to see the animation.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </motion.section>

        {/* Badges */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Badges</h2>
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>Different badge styles and sizes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge size="sm" variant="primary">Small</Badge>
                    <Badge size="md" variant="primary">Medium</Badge>
                    <Badge size="lg" variant="primary">Large</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Modal */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Modal</h2>
          <Card>
            <CardHeader>
              <CardTitle>Modal Component</CardTitle>
              <CardDescription>Accessible modal with animations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Animations Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Animations</h2>
          <Card>
            <CardHeader>
              <CardTitle>Framer Motion Integration</CardTitle>
              <CardDescription>Smooth animations throughout the design system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  className="bg-primary-100 p-4 rounded-lg text-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <p className="text-primary-800 font-medium">Hover & Tap</p>
                </motion.div>
                <motion.div
                  className="bg-secondary-100 p-4 rounded-lg text-center"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    transition: { 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <p className="text-secondary-800 font-medium">Continuous</p>
                </motion.div>
                <motion.div
                  className="bg-green-100 p-4 rounded-lg text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <p className="text-green-800 font-medium">Entrance</p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        description="This is a demonstration of the modal component"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This modal demonstrates the design system's modal component with proper
            animations, accessibility features, and responsive design.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}