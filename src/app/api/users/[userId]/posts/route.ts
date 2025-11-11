// import { validateRequest } from "@/auth";
// import prisma from "@/lib/prisma";
// import { getUserDataSelect } from "@/lib/types";

// export async function GET(
//   req: Request,
//   context: { params: Promise<{ username: string }> },
// ) {
//   try {
//     const { params } = context;
//     const { username } = await params;

//     const { user: loggedInUser } = await validateRequest();

//     if (!loggedInUser) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const user = await prisma.user.findFirst({
//       where: {
//         username: {
//           equals: username,
//           mode: "insensitive",
//         },
//       },
//       select: getUserDataSelect(loggedInUser.id),
//     });

//     if (!user) {
//       return Response.json({ error: "User not found" }, { status: 404 });
//     }

//     return Response.json(user);
//   } catch (error) {
//     console.error(error);
//     return Response.json({ error: "Internal server error" }, { status: 500 });
//   }
// }

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const { params } = context;
    const { userId } = await params;

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: { userId },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
