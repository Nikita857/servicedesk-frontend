"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { useAuthStore } from "@/stores";
import { useCrudUsers } from "@/lib/hooks/admin-users/useCrudUsers";
import { LuPlus, LuSearch } from "react-icons/lu";
import UsersTable from "@/components/features/admin-users/UsersTable";
import CreateUser from "./dialog/create/CreateUser";
import EditRoles from "./dialog/edit/EditRoles";
import EditFio from "./dialog/edit/EditFio";
import ChangePassword from "./dialog/edit/ChangePassword";
import DeleteUser from "./dialog/delete/DeleteUser";
import EditOrgModal from "./dialog/edit/EditOrgModal";

export default function UsersPage() {
  const { user } = useAuthStore();

  const {
    isAdmin,
    isLoading,
    isSubmitting,

    users,
    selectedUser,

    pageable,
    dialogState,
    dialog,
    actions,
    forms,
    utils,
  } = useCrudUsers();

  const {
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    totalPages,
    totalElements,
  } = pageable;

  const {
    isCreateOpen,
    isEditRolesOpen,
    isEditFioOpen,
    isChangePasswordOpen,
    isDeleteOpen,
    isEditOrgOpen,
  } = dialogState;

  const {
    closeCreate,
    openCreate,
    openEditRoles,
    openEditFio,
    openChangePassword,
    openDelete,
    openEditOrg,
    closeEditRoles,
    closeEditFio,
    closeChangePassword,
    closeDelete,
    closeEditOrg,
  } = dialog;

  const {
    newUser,
    setNewUser,
    editRoles,
    setEditRoles,
    editFio,
    setEditFio,
    newPassword,
    setNewPassword,
    editDepartmentId,
    setEditDepartmentId,
    editPositionId,
    setEditPositionId,
  } = forms;

  const {
    handleSearch,
    handleCreateUser,
    handleToggleActive,
    handleUpdateRoles,
    handleUpdateFio,
    handleChangePassword,
    handleDeleteUser,
    handleUpdateOrg,
  } = actions;

  const { toggleRole } = utils;

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="lg" color="fg.default" mb={1}>
            Управление пользователями
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Всего пользователей: {totalElements}
          </Text>
        </Box>

        <Button
          bg="gray.900"
          color="white"
          _hover={{ bg: "gray.800" }}
          onClick={openCreate}
        >
          <LuPlus />
          Новый пользователь
        </Button>
      </Flex>

      {/* Search */}
      <Box mb={6}>
        <form onSubmit={handleSearch}>
          <Flex gap={2}>
            <Input
              placeholder="Поиск по username или ФИО..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="bg.surface"
              flex={1}
            />
            <Button type="submit" variant="outline">
              <LuSearch />
              Найти
            </Button>
          </Flex>
        </form>
      </Box>

      {/* Users table */}
      <UsersTable
        isLoading={isLoading}
        searchQuery={searchQuery}
        users={users}
        handleToggleActive={handleToggleActive}
        openEditFio={openEditFio}
        openEditRoles={openEditRoles}
        openChangePassword={openChangePassword}
        openDelete={openDelete}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
        user={user}
        openEditOrg={openEditOrg}
      />

      {/* Create User Dialog */}
      <CreateUser
        isCreateOpen={isCreateOpen}
        closeCreate={closeCreate}
        newUser={newUser}
        setNewUser={setNewUser}
        handleCreateUser={handleCreateUser}
        isSubmitting={isSubmitting}
        toggleRole={toggleRole}
      />

      {/* Edit Roles Dialog */}
      <EditRoles
        isEditRolesOpen={isEditRolesOpen}
        selectedUser={selectedUser}
        editRoles={editRoles}
        setEditRoles={setEditRoles}
        toggleRole={toggleRole}
        closeEditRoles={closeEditRoles}
        handleUpdateRoles={handleUpdateRoles}
        isSubmitting={isSubmitting}
      />

      {/* Edit FIO Dialog */}
      <EditFio
        isEditFioOpen={isEditFioOpen}
        editFio={editFio}
        setEditFio={setEditFio}
        closeEditFio={closeEditFio}
        handleUpdateFio={handleUpdateFio}
        isSubmitting={isSubmitting}
        selectedUser={selectedUser}
      />

      {/* Change Password Dialog */}
      <ChangePassword
        isChangePasswordOpen={isChangePasswordOpen}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        closeChangePassword={closeChangePassword}
        handleChangePassword={handleChangePassword}
        isSubmitting={isSubmitting}
        selectedUser={selectedUser}
      />

      {/* Delete Dialog */}
      <DeleteUser
        isDeleteOpen={isDeleteOpen}
        closeDelete={closeDelete}
        handleDeleteUser={handleDeleteUser}
        isSubmitting={isSubmitting}
        selectedUser={selectedUser}
      />

      {/* Edit Organization Modal */}
      <EditOrgModal
        isOpen={isEditOrgOpen}
        onClose={closeEditOrg}
        selectedUser={selectedUser}
        departmentId={editDepartmentId}
        setDepartmentId={setEditDepartmentId}
        positionId={editPositionId}
        setPositionId={setEditPositionId}
        handleSave={handleUpdateOrg}
        isSubmitting={isSubmitting}
      />
    </Box>
  );
}
