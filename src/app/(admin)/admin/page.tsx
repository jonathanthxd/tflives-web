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
    { label: "Posts", value: postsCount, icon: "📝", color: "from-primary/20 to-primary/5" },
    { label: "Usuarios", value: usersCount, icon: "👥", color: "from-emerald-500/20 to-emerald-500/5" },
    { label: "Modalidades", value: modalitiesCount, icon: "🎮", color: "from-purple-500/20 to-purple-500/5" },
    { label: "Mensajes", value: messagesCount, icon: "💬", color: "from-amber-500/20 to-amber-500/5" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-primary/10 rounded-2xl p-6`}
          >
            <div className="text-3xl mb-3">{stat.icon}</div>
            <div className="font-display text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold text-foreground mb-6">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="/admin/posts/new"
            className="px-6 py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/20 transition-all duration-300"
          >
            + Nuevo Post
          </a>
          <a
            href="/admin/modalities"
            className="px-6 py-3 bg-muted/30 border border-muted-foreground/20 rounded-xl text-muted-foreground font-medium hover:border-primary/30 hover:text-primary transition-all duration-300"
          >
            Gestionar Modalidades
          </a>
        </div>
      </div>
    </div>
  );
}