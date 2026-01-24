import React from 'react';
import prisma from '@/app/lib/prisma';
import SharedScheduleView from '@/app/components/SharedScheduleView';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const schedule = await prisma.sharedSchedule.findUnique({
        where: { id },
        select: { name: true }
    });

    return {
        title: schedule?.name ? `${schedule.name} - Shared Schedule` : 'Shared Schedule - UniPlanner',
        description: 'View this schedule on UniPlanner'
    };
}

export default async function SharedPage({ params }: Props) {
    const { id } = await params;
    const schedule = await prisma.sharedSchedule.findUnique({
        where: { id }
    });

    if (!schedule) {
        notFound();
    }

    // Cast the JSON type to our Subject[] type safely
    const scheduleData = schedule.scheduleData as any;

    return (
        <SharedScheduleView
            scheduleData={scheduleData}
            id={schedule.id}
            name={schedule.name || undefined}
        />
    );
}
