import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, postDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Ambil cursor dari query param, kalau tidak ada → undefined (fetch page pertama)
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    // Tentukan jumlah post per page
    const pageSize = 10;

    // Validasi user login
    const { user } = await validateRequest();
    if (!user) {
      // Kalau user tidak valid → kembalikan error 401
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query ke database
    const posts = await prisma.post.findMany({
      include: getPostDataInclude(user.id), // ambil relasi terkait (author, comments, dsb)
      orderBy: { createdAt: "desc" }, // urut dari post terbaru
      take: pageSize + 1, // ambil 1 post ekstra untuk cek apakah ada page berikutnya
      cursor: cursor ? { id: cursor } : undefined, // kalau ada cursor → ambil post setelah ID tersebut
    });

    // Hitung nextCursor:
    // Jika ada post ekstra → ambil ID post terakhir (post ke-11) sebagai nextCursor
    // Kalau tidak ada post ekstra → page terakhir → nextCursor = null
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    // Siapkan data untuk dikirim ke frontend:
    // posts.slice(0, pageSize) → hanya kirim pageSize post pertama (post ke-11 tidak dikirim)
    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor, // pageParam untuk fetch page berikutnya
    };

    // Kembalikan response JSON
    return Response.json(data);
  } catch (error) {
    console.error(error);
    // Kalau ada error server → kembalikan error 500
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
