"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Flex,
  Grid,
  GridItem,
  SimpleGrid,
  createListCollection,
} from "@chakra-ui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, type UpdateProfileRequest } from "@/lib/api/profile";
import { adminApi } from "@/lib/api/admin";
import { handleApiError, toast } from "@/lib/utils";
import { useAuthStore } from "@/stores";

// Components
import { ProfileSidebar } from "./components/ProfileSidebar";
import { PersonalInfoCard } from "./components/PersonalInfoCard";
import { OrganizationCard } from "./components/OrganizationCard";
import { TelegramCard } from "./components/TelegramCard";
import { PasswordCard } from "./components/PasswordCard";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const updateUserAvatar = useAuthStore((state) => state.updateUserAvatar);

  // Form states
  const [fio, setFio] = useState("");
  const [email, setEmail] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [positionId, setPositionId] = useState<number | null>(null);

  const hasInitializedOrg = useRef(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => adminApi.getDepartments(),
  });

  // Fetch positions for selected department
  const { data: positions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["admin", "positions", departmentId],
    queryFn: () => adminApi.getPositionsByDepartment(departmentId!),
    enabled: !!departmentId,
  });

  const deptCollection = useMemo(
    () =>
      createListCollection({
        items: departments.map((d) => ({
          label: d.name,
          value: d.id.toString(),
        })),
      }),
    [departments],
  );

  const posCollection = useMemo(
    () =>
      createListCollection({
        items: positions.map((p) => ({
          label: p.name,
          value: p.id.toString(),
        })),
      }),
    [positions],
  );

  // Initialize org IDs from profile names
  useEffect(() => {
    if (profile && departments.length > 0 && !hasInitializedOrg.current) {
      const dept = departments.find((d) => d.name === profile.department);
      if (dept) {
        setDepartmentId(dept.id);
      } else {
        hasInitializedOrg.current = true;
      }
    }
  }, [profile, departments]);

  useEffect(() => {
    if (profile && positions.length > 0 && !hasInitializedOrg.current) {
      const pos = positions.find((p) => p.name === profile.position);
      if (pos) {
        setPositionId(pos.id);
      }
      hasInitializedOrg.current = true;
    }
  }, [profile, positions]);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFio(profile.fio || "");
      setEmail(profile.email || "");
      setTelegramId(profile.telegramId?.toString() || "");
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
    onError: (error) => handleApiError(error),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (avatarUrl) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUserAvatar(avatarUrl);
      toast.success("Аватар загружен");
    },
    onError: (error) => handleApiError(error),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      updateUserAvatar(null);
      toast.success("Аватар удалён");
    },
    onError: (error) => handleApiError(error),
  });

  const updateOrgMutation = useMutation({
    mutationFn: () =>
      adminApi.updateDepartmentAndPosition(
        profile?.id || 0,
        departmentId,
        positionId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Данные организации обновлены");
    },
    onError: (error) => handleApiError(error, { context: "обновить отдел" }),
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
    if (newPassword.length < 4) {
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

      <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={8}>
        {/* Left column - Avatar & Identity */}
        <GridItem>
          <ProfileSidebar
            profile={profile}
            onAvatarClick={handleAvatarClick}
            onDeleteAvatar={() => deleteAvatarMutation.mutate()}
            isDeletingAvatar={deleteAvatarMutation.isPending}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />
        </GridItem>

        {/* Right column - Grid of Settings Cards */}
        <GridItem>
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} alignItems="stretch">
            <PersonalInfoCard
              profile={profile}
              fio={fio}
              setFio={setFio}
              email={email}
              setEmail={setEmail}
              onSave={handleSaveProfile}
              isPending={updateProfileMutation.isPending}
            />

            <OrganizationCard
              departmentId={departmentId}
              setDepartmentId={setDepartmentId}
              positionId={positionId}
              setPositionId={setPositionId}
              deptCollection={deptCollection}
              posCollection={posCollection}
              isLoadingDepts={isLoadingDepts}
              isLoadingPositions={isLoadingPositions}
              onUpdate={() => updateOrgMutation.mutate()}
              isPending={updateOrgMutation.isPending}
            />

            <TelegramCard
              profile={profile}
              telegramId={telegramId}
              setTelegramId={setTelegramId}
              onUpdate={handleUpdateTelegram}
              isPending={updateTelegramMutation.isPending}
            />

            <PasswordCard
              oldPassword={oldPassword}
              setOldPassword={setOldPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onUpdate={handleChangePassword}
              isPending={changePasswordMutation.isPending}
            />
          </SimpleGrid>
        </GridItem>
      </Grid>
    </Box>
  );
}
