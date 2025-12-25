"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Spinner,
  Flex,
  Badge,
  Avatar,
  Icon,
  Separator,
  Grid,
  GridItem,
  Field,
} from "@chakra-ui/react";
import {
  LuUser,
  LuLock,
  LuCamera,
  LuStar,
  LuCalendar,
  LuShield,
  LuTrash2,
  LuSave,
  LuCheck,
} from "react-icons/lu";
import { FaTelegram } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, type UpdateProfileRequest } from "@/lib/api/profile";
import { toast } from "@/lib/utils";
import { SenderType, userRolesBadges } from "@/types";
import { useAuthStore } from "@/stores";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUserAvatar = useAuthStore((state) => state.updateUserAvatar);

  // Form states
  const [fio, setFio] = useState("");
  const [email, setEmail] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFio(profile.fio || "");
      setEmail(profile.email || "");
      setTelegramId(profile.telegramId?.toString() || "");
      console.log("[Profile] avatarUrl:", profile.avatarUrl);
    }
  }, [profile]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Профиль обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении профиля"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Пароль изменён");
    },
    onError: () =>
      toast.error("Ошибка при смене пароля. Проверьте текущий пароль"),
  });

  const updateTelegramMutation = useMutation({
    mutationFn: profileApi.updateTelegram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Telegram привязан");
    },
    onError: () => toast.error("Ошибка при привязке Telegram"),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUserAvatar(avatarUrl);
      toast.success("Аватар загружен");
    },
    onError: () => toast.error("Ошибка при загрузке аватара"),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUserAvatar(null);
      toast.success("Аватар удалён");
    },
    onError: () => toast.error("Ошибка при удалении аватара"),
  });

  // Handlers
  const handleSaveProfile = () => {
    const updates: UpdateProfileRequest = {};
    if (fio !== (profile?.fio || "")) updates.fio = fio;
    if (email !== (profile?.email || "")) updates.email = email;

    if (Object.keys(updates).length > 0) {
      updateProfileMutation.mutate(updates);
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  const handleUpdateTelegram = () => {
    const id = parseInt(telegramId, 10);
    if (isNaN(id)) {
      toast.error("Введите корректный Telegram ID");
      return;
    }
    updateTelegramMutation.mutate({ telegramId: id });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Максимальный размер файла — 5 МБ");
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!profile) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="fg.muted">Не удалось загрузить профиль</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={8}>
        <Heading size="xl" color="fg.default" mb={2}>
          Личный кабинет
        </Heading>
        <Text color="fg.muted">Управление профилем и настройками аккаунта</Text>
      </Box>

      <Grid templateColumns={{ base: "1fr", lg: "340px 1fr" }} gap={6}>
        {/* Left column - Avatar & Info */}
        <GridItem>
          <Box
            bg="bg.surface"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.default"
            p={6}
          >
            {/* Avatar */}
            <VStack gap={4} mb={6}>
              <Box position="relative">
                <Avatar.Root
                  size="2xl"
                  w="130px"
                  h="130px"
                  cursor="pointer"
                  onClick={handleAvatarClick}
                >
                  <Avatar.Fallback name={profile.fio || profile.username} />
                  {profile.avatarUrl && (
                    <Avatar.Image src={profile.avatarUrl} />
                  )}
                </Avatar.Root>
                <Box
                  position="absolute"
                  bottom={0}
                  right={0}
                  bg="blue.500"
                  borderRadius="full"
                  w={8}
                  h={8}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  onClick={handleAvatarClick}
                  _hover={{ bg: "blue.600" }}
                >
                  <Icon as={LuCamera} color="white" boxSize={4} />
                </Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Box>

              {profile.avatarUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => deleteAvatarMutation.mutate()}
                  loading={deleteAvatarMutation.isPending}
                >
                  <Icon as={LuTrash2} mr={1} />
                  Удалить аватар
                </Button>
              )}

              <Text fontSize="xl" fontWeight="semibold" color="fg.default">
                {profile.fio || profile.username}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                @{profile.username}
              </Text>
            </VStack>

            <Separator mb={4} />

            {/* Roles */}
            <VStack align="start" gap={3} mb={4}>
              <HStack gap={2}>
                <Icon as={LuShield} color="fg.muted" />
                <Text fontSize="sm" color="fg.muted">
                  Роли:
                </Text>
              </HStack>
              <HStack flexWrap="wrap" gap={2}>
                {profile.roles.map((role) => {
                  const roleInfo = userRolesBadges[role as SenderType] || {
                    name: role,
                    color: "gray",
                  };
                  return (
                    <Badge key={role} colorPalette={roleInfo.color} size="sm">
                      {roleInfo.name}
                    </Badge>
                  );
                })}
              </HStack>
            </VStack>

            {/* Specialist Rating */}
            {profile.isSpecialist && profile.averageRating !== null && (
              <HStack gap={2} mb={4}>
                <Icon as={LuStar} color="yellow.500" />
                <Text fontSize="sm">
                  Средняя оценка:{" "}
                  <Text as="span" fontWeight="semibold">
                    {profile.averageRating.toFixed(1)}
                  </Text>
                  <Text as="span" color="fg.muted">
                    {" "}
                    ({profile.ratedTicketsCount} отзывов)
                  </Text>
                </Text>
              </HStack>
            )}

            {/* Registration date */}
            <HStack gap={2}>
              <Icon as={LuCalendar} color="fg.muted" />
              <Text fontSize="sm" color="fg.muted">
                Зарегистрирован:{" "}
                {new Date(profile.createdAt).toLocaleDateString("ru-RU")}
              </Text>
            </HStack>
          </Box>
        </GridItem>

        {/* Right column - Forms */}
        <GridItem>
          <VStack gap={6} align="stretch">
            {/* Profile Info */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <HStack mb={4}>
                <Icon as={LuUser} color="blue.500" />
                <Heading size="md">Основная информация</Heading>
              </HStack>

              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Field.Label>ФИО</Field.Label>
                  <Input
                    value={fio}
                    onChange={(e) => setFio(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </Field.Root>

                <Button
                  colorPalette="blue"
                  onClick={handleSaveProfile}
                  loading={updateProfileMutation.isPending}
                  disabled={
                    fio === (profile.fio || "") &&
                    email === (profile.email || "")
                  }
                >
                  <Icon as={LuSave} mr={2} />
                  Сохранить изменения
                </Button>
              </VStack>
            </Box>

            {/* Telegram */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <HStack mb={4}>
                <Icon as={FaTelegram} color="blue.400" />
                <Heading size="md">Telegram</Heading>
                {profile.telegramId && (
                  <Badge colorPalette="green" size="sm">
                    <Icon as={LuCheck} mr={1} />
                    Привязан
                  </Badge>
                )}
              </HStack>

              <Text fontSize="sm" color="fg.muted" mb={4}>
                Привяжите Telegram для получения уведомлений. Ваш Telegram ID
                можно узнать у бота @userinfobot
              </Text>

              <HStack gap={3}>
                <Input
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Telegram ID"
                  type="number"
                  flex={1}
                />
                <Button
                  colorPalette="blue"
                  onClick={handleUpdateTelegram}
                  loading={updateTelegramMutation.isPending}
                >
                  Привязать
                </Button>
              </HStack>
            </Box>

            {/* Password */}
            <Box
              bg="bg.surface"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.default"
              p={6}
            >
              <HStack mb={4}>
                <Icon as={LuLock} color="orange.500" />
                <Heading size="md">Изменение пароля</Heading>
              </HStack>

              <VStack gap={4} align="stretch">
                <Field.Root>
                  <Field.Label>Текущий пароль</Field.Label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Новый пароль</Field.Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Подтверждение пароля</Field.Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </Field.Root>

                <Button
                  colorPalette="orange"
                  onClick={handleChangePassword}
                  loading={changePasswordMutation.isPending}
                  disabled={!oldPassword || !newPassword || !confirmPassword}
                >
                  <Icon as={LuLock} mr={2} />
                  Сменить пароль
                </Button>
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
}
