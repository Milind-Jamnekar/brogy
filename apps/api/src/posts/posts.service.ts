import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}
  create(createPostDto: CreatePostDto) {
    const post = this.postRepository.create(createPostDto);

    return this.postRepository.save(post);
  }

  // async findAll({ title, from, to, published }: FilterPostDto) {
  //   const qb = this.postRepository.createQueryBuilder('post');
  //   if (title) {
  //     qb.andWhere('post.title ILIKE :title', { title: `%${title}%` });
  //   }

  //   if (from) qb.andWhere('post.createdAt >= :from', { from: new Date(from) });
  //   if (to) qb.andWhere('post.createdAt <= :to', { to: new Date(to) });

  //   if (typeof published === 'boolean') {
  //     qb.andWhere('post.published = :published', { published });
  //   }

  //   // const page = Math.max(1, filters.page || 1);
  //   // const limit = Math.min(100, filters.limit || 10);

  //   const [posts, total] = await qb.getManyAndCount();
  //   return { meta: { total }, data: posts };

  //   return this.postRepository.find();
  // }

  async findAll({
    title,
    from,
    to,
    published,
    page,
    limit,
    tags,
  }: FilterPostDto) {
    const query = this.postRepository.createQueryBuilder('post');

    if (title) {
      query.andWhere('post.title ILIKE :title', { title: `%${title}%` });
    }

    if (from) {
      query.andWhere('post.createdAt >= :from', {
        from,
      });
    }

    if (to) {
      query.andWhere('post.createdAt <= :to', { to });
    }

    if (typeof published === 'boolean') {
      query.andWhere('post.published = :published', { published });
    }

    if (Array.isArray(tags)) {
      console.log(tags);

      query
        .andWhere('post.tags IS NOT NULL')
        .andWhere('post.tags && ARRAY[:...tags]', { tags });
    }

    const pageNo = page ?? 1;
    const limitNo = limit ?? 10;

    query.skip((pageNo - 1) * limitNo).take(limit);

    const [posts, total] = await query.getManyAndCount();
    console.log('posts length', posts.length, 'total', total);

    return { meta: { total }, data: posts };
  }

  async findOne(id: number) {
    const post = await this.postRepository.find({ where: { id } });
    if (!post) throw new NotFoundException(`Given id = ${id} post not found!`);
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.findOne(id);
    if (!post) throw new NotFoundException(`Given id = ${id} post not found!`);

    const newPost = Object.assign(post, updatePostDto);

    return this.postRepository.save(newPost);
  }

  async remove(id: number) {
    const result = await this.postRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post #${id} not found`);
    }
    return { deleted: true };
  }
}
