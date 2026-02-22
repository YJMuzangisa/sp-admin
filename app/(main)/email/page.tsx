// app/email/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Input,
    Button,
    Textarea,
    Checkbox,
    CheckboxGroup,
    Select,
    SelectItem,
    Tabs,
    Tab
} from "@nextui-org/react";
import { Send, Search } from 'lucide-react';

interface Business {
    id: string;
    name: string;
    subscription: { status: string } | null;
    owner: { id: string; email: string; name: string | null };
}

interface User {
    emailVerified: boolean;
    id: string;
    email: string;
    name: string | null;
    ownedBusinesses: { id: string; name: string; subscription: { status: string } | null }[];
}

interface EmailTemplate {
    subject: string;
    body: string;
}

const templateGroups: Record<string, Record<string, EmailTemplate>> = {
    "Onboarding": {
        "Welcome Message": {
            subject: "Welcome to SalesPath",
            body: `Hey <strong>{{name}}</strong>,

Welcome to SalesPath — really glad to have you here.

To get started, head to your dashboard and connect your Takealot API key. Once that's done, we'll start monitoring your competitors and adjusting your prices to win the buybox.

If you run into anything or have questions, just reply to this email.`,
        },
        "Business Setup Reminder": {
            subject: "Still getting set up?",
            body: `Hey <strong>{{name}}</strong>,

Just checking in — it looks like your Takealot API key hasn't been connected yet.

It only takes a minute, and once it's done SalesPath will start working in the background to keep you competitive on Takealot.

If you're unsure where to find your API key or need any help, reply here and I'll walk you through it.`,
        },
    },
    "Subscription": {
        "Trial Ending Soon": {
            subject: "Your SalesPath trial ends soon",
            body: `Hey <strong>{{name}}</strong>,

Your free trial for <strong>{{businessName}}</strong> is coming to an end soon.

To keep monitoring running without interruption, upgrade to a paid plan from your dashboard. If you're not sure which plan is right for you, just reply and I'll help you figure it out.`,
        },
        "Trial Expired": {
            subject: "Your SalesPath trial has ended",
            body: `Hey <strong>{{name}}</strong>,

Your free trial for <strong>{{businessName}}</strong> has expired and monitoring has been paused.

Your data, settings, and offer rules are all still saved — you just need to upgrade to pick up right where you left off.

Log in to your dashboard to choose a plan and reactivate.`,
        },
        "Payment Past Due": {
            subject: "Action needed: payment issue on <strong>{{businessName}}</strong>",
            body: `Hey <strong>{{name}}</strong>,

We weren't able to process your last payment for <strong>{{businessName}}</strong>.

Your monitoring is still running for now, but it'll be paused if this isn't resolved soon. You can update your payment details directly from your dashboard.

If there's an issue or you need help sorting it out, just reply here.`,
        },
        "Upcoming Renewal Reminder": {
            subject: "Your SalesPath subscription renews soon",
            body: `Hey <strong>{{name}}</strong>,

Just a heads up — your SalesPath subscription for <strong>{{businessName}}</strong> will renew soon.

No action needed if your card is up to date. If you'd like to make any changes before then, log in to your dashboard.`,
        },
        "Subscription Status Update": {
            subject: "Update on your SalesPath subscription",
            body: `Hey <strong>{{name}}</strong>,

This is a quick note regarding your subscription for {{businessName}}.

Your current status is: <strong>{{status}}</strong>.

If you have any questions or need help with anything, just reply to this email.`,
        },
    },
    "Reactivation": {
        "Reactivation — Cancelled": {
            subject: "Your SalesPath account is still here",
            body: `Hey <strong>{{name}}</strong>,

We noticed your SalesPath subscription for <strong>{{businessName}}</strong> was cancelled.

If something wasn't working or we could have done better, I'd genuinely like to know — just reply to this email.

And if you ever want to get back to monitoring and winning the buybox, your account is ready to reactivate whenever you are.`,
        },
        "Reactivation — Expired": {
            subject: "Pick up where you left off",
            body: `Hey <strong>{{name}}</strong>,

Your SalesPath subscription for <strong>{{businessName}}</strong> has lapsed — but your offers, rules, and settings are all still saved.

Reactivate anytime from your dashboard and you'll be back to monitoring your competitors straight away.`,
        },
    },
    "Announcements": {
        "Feature Announcement": {
            subject: "New on SalesPath: [Feature Name]",
            body: `Hi {{name}},

We just shipped something new that I think you'll find useful.

[Describe the feature here — what it does and why it matters]

Log in to your dashboard to check it out. As always, if you have feedback or run into anything, just reply here.`,
        },
        "Maintenance Notice": {
            subject: "Heads up: scheduled maintenance on [DATE]",
            body: `Hi {{name}},

We're doing some planned maintenance on SalesPath on [DATE] from [START TIME] to [END TIME] (SAST).

During this window, monitoring will be temporarily paused. Everything will resume automatically once we're done — no action needed on your end.

Apologies for the interruption.`,
        },
    },
};

export default function EmailPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [sending, setSending] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [selectedTab, setSelectedTab] = useState("users");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setSearchQuery(""); }, [selectedTab]);

    const fetchData = async () => {
        try {
            const [usersRes, businessesRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/businesses')
            ]);
            if (!usersRes.ok || !businessesRes.ok) throw new Error('Failed to fetch data');
            setUsers(await usersRes.json());
            setBusinesses(await businessesRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const getUserFilters = () => [
        { key: "all", label: "All Users" },
        { key: "no_business", label: "No Business" },
        { key: "verified", label: "Verified" },
        { key: "unverified", label: "Unverified" },
    ];

    const getBusinessFilters = () => [
        { key: "all", label: "All Businesses" },
        { key: "trial", label: "Trial" },
        { key: "active", label: "Active" },
        { key: "expired", label: "Expired" },
        { key: "cancelled", label: "Cancelled" },
        { key: "past_due", label: "Past Due" },
    ];

    const filterItems = (filterType: string): User[] | Business[] => {
        if (selectedTab === "users") {
            switch (filterType) {
                case "no_business": return users.filter(u => u.ownedBusinesses.length === 0);
                case "verified": return users.filter(u => u.emailVerified);
                case "unverified": return users.filter(u => !u.emailVerified);
                default: return users;
            }
        } else {
            if (filterType === "all") return businesses;
            return businesses.filter(b => b.subscription?.status.toLowerCase() === filterType);
        }
    };

    const filteredAndSearched = useMemo(() => {
        const filtered = filterItems(filterType);
        if (!searchQuery.trim()) return filtered;
        const q = searchQuery.toLowerCase();
        if (selectedTab === "users") {
            return (filtered as User[]).filter(u =>
                u.email.toLowerCase().includes(q) ||
                u.name?.toLowerCase().includes(q) ||
                u.ownedBusinesses.some(b => b.name.toLowerCase().includes(q))
            );
        } else {
            return (filtered as Business[]).filter(b =>
                b.name.toLowerCase().includes(q) ||
                b.owner?.email.toLowerCase().includes(q) ||
                b.owner?.name?.toLowerCase().includes(q)
            );
        }
    }, [filterType, searchQuery, users, businesses, selectedTab]);

    const handleFilterChange = (value: string) => {
        setFilterType(value);
        setSearchQuery("");
        setSelectedRecipients(filterItems(value).map(item => item.id));
    };

    const handleSendEmail = async () => {
        if (!subject || !emailBody || selectedRecipients.length === 0) {
            alert('Please fill in all fields and select recipients');
            return;
        }
        setSending(true);
        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: selectedTab, recipientIds: selectedRecipients, subject, body: emailBody }),
            });
            if (!response.ok) throw new Error('Failed to send emails');
            alert('Emails sent successfully!');
            setSubject('');
            setEmailBody('');
            setSelectedRecipients([]);
        } catch (error) {
            console.error('Error sending emails:', error);
            alert('Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    const renderUserCheckboxes = (users: User[]) =>
        users.map((user) => (
            <Checkbox key={user.id} value={user.id} className="p-2">
                <div className="flex flex-col">
                    <span>{user.email}</span>
                    <span className="text-xs text-gray-500">
                        {user.name && <span>{user.name} · </span>}
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                    {user.ownedBusinesses?.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {user.ownedBusinesses.map(b => b.name).join(', ')}
                        </span>
                    )}
                </div>
            </Checkbox>
        ));

    const renderBusinessCheckboxes = (businesses: Business[]) =>
        businesses.map((business) => (
            <Checkbox key={business.id} value={business.id} className="p-2">
                <div className="flex flex-col">
                    <span>{business.name}</span>
                    <span className="text-xs text-gray-500">{business.owner?.email}</span>
                    <span className="text-xs text-gray-500">{business.subscription?.status ?? 'No subscription'}</span>
                </div>
            </Checkbox>
        ));

    const recipientCount = filteredAndSearched.length;

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Email Management</h1>

            <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => {
                    setSelectedTab(key.toString());
                    setFilterType("all");
                    setSelectedRecipients([]);
                }}
            >
                <Tab key="users" title="Users">
                    <Card className="p-4 mt-4">
                        <h2 className="text-lg font-medium mb-4">Select Users</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Select
                                    label="Filter"
                                    value={filterType}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="flex-1"
                                >
                                    {getUserFilters().map(f => (
                                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    placeholder="Search name, email or business..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    startContent={<Search size={16} className="text-gray-400" />}
                                    className="flex-1"
                                    isClearable
                                    onClear={() => setSearchQuery("")}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    {searchQuery ? `${recipientCount} result${recipientCount !== 1 ? 's' : ''} · ` : ''}
                                    Selected: {selectedRecipients.length}
                                </p>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                                    <CheckboxGroup value={selectedRecipients} onChange={(v) => setSelectedRecipients(v as string[])}>
                                        {renderUserCheckboxes(filteredAndSearched as User[])}
                                    </CheckboxGroup>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Tab>

                <Tab key="businesses" title="Businesses">
                    <Card className="p-4 mt-4">
                        <h2 className="text-lg font-medium mb-4">Select Businesses</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <Select
                                    label="Filter"
                                    value={filterType}
                                    onChange={(e) => handleFilterChange(e.target.value)}
                                    className="flex-1"
                                >
                                    {getBusinessFilters().map(f => (
                                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                                    ))}
                                </Select>
                                <Input
                                    placeholder="Search name, email or owner..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    startContent={<Search size={16} className="text-gray-400" />}
                                    className="flex-1"
                                    isClearable
                                    onClear={() => setSearchQuery("")}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    {searchQuery ? `${recipientCount} result${recipientCount !== 1 ? 's' : ''} · ` : ''}
                                    Selected: {selectedRecipients.length}
                                </p>
                                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                                    <CheckboxGroup value={selectedRecipients} onChange={(v) => setSelectedRecipients(v as string[])}>
                                        {renderBusinessCheckboxes(filteredAndSearched as Business[])}
                                    </CheckboxGroup>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Tab>
            </Tabs>

            <Card className="p-4">
                <h2 className="text-lg font-medium mb-4">Email Content</h2>
                <div className="space-y-4">
                    <Select
                        label="Use Template"
                        onChange={(e) => {
                            for (const group of Object.values(templateGroups)) {
                                if (group[e.target.value]) {
                                    setSubject(group[e.target.value].subject);
                                    setEmailBody(group[e.target.value].body);
                                    break;
                                }
                            }
                        }}
                    >
                        {Object.entries(templateGroups).flatMap(([group, templates]) => [
                            <SelectItem
                                key={`__group__${group}`}
                                value=""
                                isReadOnly
                                className="text-xs font-semibold text-gray-400 uppercase tracking-wider pointer-events-none opacity-60"
                            >
                                {group}
                            </SelectItem>,
                            ...Object.keys(templates).map(name => (
                                <SelectItem key={name} value={name} className="pl-4">
                                    {name}
                                </SelectItem>
                            ))
                        ])}
                    </Select>

                    <Input
                        label="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                    />

                    <Textarea
                        label="Message"
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Enter email content"
                        minRows={6}
                    />

                    <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-600 mb-1">Available variables</p>
                        <p><code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> — recipient&apos;s name</p>
                        {selectedTab === "users" && (
                            <p><code className="bg-gray-100 px-1 rounded">{"{{businessNames}}"}</code> — their business name(s)</p>
                        )}
                        {selectedTab === "businesses" && (
                            <>
                                <p><code className="bg-gray-100 px-1 rounded">{"{{businessName}}"}</code> — business name</p>
                                <p><code className="bg-gray-100 px-1 rounded">{"{{status}}"}</code> — subscription status</p>
                            </>
                        )}
                    </div>

                    <Button
                        color="primary"
                        onClick={handleSendEmail}
                        isLoading={sending}
                        startContent={!sending && <Send size={18} />}
                        className="w-full sm:w-auto"
                        isDisabled={sending || selectedRecipients.length === 0}
                    >
                        {sending ? `Sending to ${selectedRecipients.length}...` : `Send to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </Card>
        </div>
    );
}