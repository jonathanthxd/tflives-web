import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      username: true,
      displayName: true,
      name: true,
      image: true,
      bannerUrl: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.displayName || user.name || user.username || "Usuario";
  const initial = (displayName[0] || "U").toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <div
            className="h-32 sm:h-44 bg-gradient-to-br from-primary/30 to-primary/5"
            style={
              user.bannerUrl
                ? { backgroundImage: `url(${user.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          />

          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-card"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-card flex items-center justify-center">
                  <span className="font-display text-2xl font-bold text-primary">{initial}</span>
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground">{displayName}</h1>
            {user.username && <p className="text-primary text-sm">@{user.username}</p>}

            {user.bio && <p className="mt-4 text-foreground/90 whitespace-pre-line">{user.bio}</p>}

            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Se unió en {joinedDate}</span>
              {user.role !== "USER" && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
