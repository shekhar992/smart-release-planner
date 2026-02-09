import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card } from '../components/ui/card';
import { loadData, createTeamMember, updateTeamMember, deleteTeamMember } from '../lib/storage';
import { AppData, TeamMember } from '../lib/types';
import { Link } from 'react-router';

export default function TeamPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Developer' | 'Designer' | 'QA'>('Developer');

  useEffect(() => {
    setData(loadData());
  }, []);

  const handleAddMember = () => {
    if (!data || !newMemberName.trim()) return;

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      role: newMemberRole,
    };

    const newData = createTeamMember(data, newMember);
    setData(newData);
    setNewMemberName('');
    setNewMemberRole('Developer');
  };

  const handleDeleteMember = (memberId: string) => {
    if (!data) return;
    const newData = deleteTeamMember(data, memberId);
    setData(newData);
  };

  const handleUpdateMember = (memberId: string, updates: Partial<TeamMember>) => {
    if (!data) return;
    const newData = updateTeamMember(data, memberId, updates);
    setData(newData);
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Team Management</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage team members for assignment</p>
          </div>
          <Link to="/">
            <Button variant="outline">Back to Releases</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Add Member Form */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Add Team Member</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              />
            </div>
            <div className="w-40">
              <Select value={newMemberRole} onValueChange={(v: any) => setNewMemberRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              <Plus className="size-4 mr-2" />
              Add
            </Button>
          </div>
        </Card>

        {/* Team Members List */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Team Members ({data.teamMembers.length})</h2>
          {data.teamMembers.length === 0 ? (
            <Card className="p-8 text-center text-neutral-500">
              No team members yet. Add your first team member above.
            </Card>
          ) : (
            <div className="space-y-2">
              {data.teamMembers.map((member) => (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-4">
                      <Input
                        value={member.name}
                        onChange={(e) =>
                          handleUpdateMember(member.id, { name: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Select
                        value={member.role}
                        onValueChange={(v: any) => handleUpdateMember(member.id, { role: v })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="Designer">Designer</SelectItem>
                          <SelectItem value="QA">QA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
