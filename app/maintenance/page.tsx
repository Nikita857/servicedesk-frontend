'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, VStack, HStack, Heading, Text, Separator } from '@chakra-ui/react'
import { LuWrench } from 'react-icons/lu'

// Парсит формат "DD.MM.YYYY HH:MM" как московское время (UTC+3)
function parseMoscowTime(value: string): number {
    const [datePart, timePart] = value.trim().split(' ')
    const [day, month, year] = datePart.split('.')
    const [hour, minute] = (timePart ?? '00:00').split(':')
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+03:00`).getTime()
}

const END_TIME = parseMoscowTime(
    process.env.NEXT_PUBLIC_MAINTENANCE_END ?? '04.03.2026 15:00'
)

function TimeBlock({ value, label }: { value: number; label: string }) {
    return (
        <VStack gap={1}>
            <Box
                bg="bg.subtle"
                border="1px solid"
                borderColor="border.default"
                borderRadius="lg"
                px={5}
                py={3}
                minW="72px"
                textAlign="center"
            >
                <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color="fg.default"
                    letterSpacing="-0.03em"
                    fontVariantNumeric="tabular-nums"
                >
                    {String(value).padStart(2, '0')}
                </Text>
            </Box>
            <Text fontSize="xs" color="fg.subtle" fontWeight="medium">
                {label}
            </Text>
        </VStack>
    )
}

function Colon() {
    return (
        <Text fontSize="2xl" fontWeight="bold" color="fg.muted" mb={5} userSelect="none">
            :
        </Text>
    )
}

export default function Maintenance() {
    const [timeLeft, setTimeLeft] = useState(() => END_TIME - Date.now())
    const reloadScheduled = useRef(false)

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = END_TIME - Date.now()
            setTimeLeft(remaining)

            if (remaining <= 0 && !reloadScheduled.current) {
                reloadScheduled.current = true
                setTimeout(() => window.location.reload(), 3000)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const isFinished = timeLeft <= 0
    const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return (
        <Box
            minH="100vh"
            bg="bg.canvas"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={4}
        >
            <Box
                maxW="480px"
                w="full"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.default"
                borderRadius="2xl"
                p={10}
                boxShadow="sm"
            >
                <VStack gap={7} textAlign="center">
                    <Box
                        bg="bg.subtle"
                        border="1px solid"
                        borderColor="border.default"
                        borderRadius="xl"
                        p={4}
                        color="fg.muted"
                    >
                        <LuWrench size={28} />
                    </Box>

                    <VStack gap={2}>
                        <Heading size="xl" color="fg.default" fontWeight="semibold" letterSpacing="-0.02em">
                            Технические работы
                        </Heading>
                        <Text color="fg.muted" fontSize="sm" maxW="340px">
                            Мы обновляем систему. Сайт временно недоступен.
                        </Text>
                    </VStack>

                    <Separator borderColor="border.default" />

                    <VStack gap={4}>
                        <Text fontSize="xs" color="fg.subtle" fontWeight="medium" textTransform="uppercase" letterSpacing="0.08em">
                            Ожидаемое время завершения
                        </Text>

                        {isFinished ? (
                            <Text fontSize="md" color="fg.muted" fontWeight="medium">
                                Завершаем последние проверки…
                            </Text>
                        ) : (
                            <HStack gap={2} align="flex-end">
                                <TimeBlock value={hours} label="часов" />
                                <Colon />
                                <TimeBlock value={minutes} label="минут" />
                                <Colon />
                                <TimeBlock value={seconds} label="секунд" />
                            </HStack>
                        )}
                    </VStack>

                    <Separator borderColor="border.default" />

                    <Text fontSize="xs" color="fg.subtle">
                        Страница обновится автоматически по окончании работ
                    </Text>
                </VStack>
            </Box>
        </Box>
    )
}
