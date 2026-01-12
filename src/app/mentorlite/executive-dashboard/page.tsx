'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, HelpCircle, TrendingUp, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { getSystemAnalytics } from '@/app/actions/get-system-analytics';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    subscription?: {
        plan: string;
        status: string;
    };
    createdAt?: {
      seconds: number;
      nanoseconds: number;
    };
}

interface AnalyticsData {
  totalUsers: {
    count: number;
    newToday: number;
  };
  engagement: {
    questionsAnswered24h: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function ExecutiveDashboardContent() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState('7');
    const [isLoading, setIsLoading] = useState(true);

    const userDocRef = useMemoFirebase(() => 
        (user ? doc(firestore, `users/${user.uid}`) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);
    
    useEffect(() => {
        if (!isUserLoading && !isProfileLoading) {
            const plan = userProfile?.subscription?.plan;
            if (plan !== 'mentoria_plus_plus' && user?.email !== 'amentoriaacademy@gmail.com') {
                router.push('/mentorlite');
            }
        }
    }, [user, isUserLoading, userProfile, isProfileLoading, router]);

    useEffect(() => {
        setIsLoading(true);
        getSystemAnalytics().then(data => {
            setAnalyticsData(data);
            setIsLoading(false);
        });
    }, [period]);

    // This is mock data for charts that require more complex backend logic
    const engagementByDay = [
        { name: 'Seg', questoes: 400 }, { name: 'Ter', questoes: 300 },
        { name: 'Qua', questoes: 500 }, { name: 'Qui', questoes: 700 },
        { name: 'Sex', questoes: 600 }, { name: 'Sáb', questoes: 800 },
        { name: 'Dom', questoes: 200 },
    ];
    
    const usersByPlan = [
        { name: 'Standard', value: analyticsData ? analyticsData.totalUsers.count - 1 : 0 },
        { name: 'MentorIA+', value: 1 }, // Mock
    ];

    if (isUserLoading || isProfileLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Executiva</h1>
                    <p className="text-muted-foreground">Visão geral da saúde e engajamento da plataforma.</p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Hoje</SelectItem>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : (
                            <div className="text-2xl font-bold">{analyticsData?.totalUsers.count}</div>
                        )}
                        {isLoading ? <Skeleton className="h-4 w-3/4 mt-1" /> : (
                            <p className="text-xs text-muted-foreground">+{analyticsData?.totalUsers.newToday} hoje</p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engajamento (24h)</CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-1/2" /> : (
                            <div className="text-2xl font-bold">{analyticsData?.engagement.questionsAnswered24h}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Questões respondidas</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita (Exemplo)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold">R$ 1.250,00</div>
                         <p className="text-xs text-muted-foreground">+15% vs. mês passado</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5"/> Atividade Semanal</CardTitle>
                        <CardDescription>Volume de questões respondidas nos últimos 7 dias.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={engagementByDay}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="questoes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Distribuição de Planos</CardTitle>
                        <CardDescription>Como os usuários estão distribuídos entre os planos.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                         <ResponsiveContainer>
                            <PieChart>
                                <Pie data={usersByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {usersByPlan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}


export default function ExecutiveDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ExecutiveDashboardContent />
        </Suspense>
    )
}
