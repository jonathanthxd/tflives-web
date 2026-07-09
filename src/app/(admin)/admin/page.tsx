import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [postsCount, usersCount, modalitiesCount, messagesCount] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.modality.count(),
    prisma.message.count(),
  ]);

  const stats = [
    { label: "Posts", value: postsCount, icon: "📝", color: "from-tfl-sky/20 to-tfl-sky/5" },
    { label: "Usuarios", value: usersCount, icon: "👥", color: "from-emerald-500/20 to-emerald-500/5" },
    { label: "Modalidades", value: modalitiesCount, icon: "🎮", color: "from-purple-500/20 to-purple-500/5" },
    { label: "Mensajes", value: messagesCount, icon: "💬", color: "from-amber-500/20 to-amber-500/5" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-tfl-bone mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-tfl-sky/10 rounded-2xl p-6`}
          >
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className="font-display text-3xl font-bold text-tfl-bone mb-1">{stat.value}</div>
            <div className="text-sm text-tfl-stone">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold text-tfl-bone mb-6">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/admin/posts/new"
            className="px-6 py-3 bg-tfl-sky/10 border border-tfl-sky/30 rounded-xl text-tfl-sky font-medium hover:bg-tfl-sky/20 transition-all duration-300"
          >
            + Nuevo Post
          </a>
          <a
            href="/admin/modalities"
            className="px-6 py-3 bg-tfl-slate/30 border border-tfl-stone/20 rounded-xl text-tfl-stone font-medium hover:border-tfl-sky/30 hover:text-tfl-sky transition-all duration-300"
          >
            Gestionar Modalidades
          </a>
        </div>
      </div>
    </div>
  );
}