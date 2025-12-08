'use client';

import { useState, FormEvent } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toaster } from '@/components/ui/toaster';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toaster.error({
        title: 'Ошибка',
        description: 'Введите имя пользователя и пароль',
      });
      return;
    }

    setIsSubmitting(true);
    await login({ username: username.trim(), password });
    setIsSubmitting(false);
  };

  return (
    <Flex minH="100vh" bg="bg.canvas" align="center" justify="center">
      <Container maxW="md">
        <Box
          bg="bg.surface"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.default"
          p={8}
          shadow="lg"
        >
          <VStack gap={6}>
            {/* Header */}
            <VStack gap={2} textAlign="center">
              <Heading size="xl" color="fg.default">
                ServiceDesk
              </Heading>
              <Text color="fg.muted" fontSize="sm">
                Система поддержки пользователей
              </Text>
            </VStack>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap={4} w="full">
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                    Имя пользователя
                  </Text>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Введите логин"
                    size="lg"
                    bg="bg.subtle"
                    borderColor="border.default"
                    _focus={{
                      borderColor: 'gray.600',
                      boxShadow: '0 0 0 1px var(--chakra-colors-gray-600)',
                    }}
                  />
                </Box>

                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium" color="fg.default">
                    Пароль
                  </Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль"
                    size="lg"
                    bg="bg.subtle"
                    borderColor="border.default"
                    _focus={{
                      borderColor: 'gray.600',
                      boxShadow: '0 0 0 1px var(--chakra-colors-gray-600)',
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  bg="gray.900"
                  color="white"
                  w="full"
                  mt={2}
                  loading={isSubmitting || isLoading}
                  loadingText="Вход..."
                  _hover={{ bg: 'gray.800' }}
                  _active={{ bg: 'gray.700' }}
                >
                  Войти
                </Button>
              </Stack>
            </form>
          </VStack>
        </Box>
      </Container>
    </Flex>
  );
}
