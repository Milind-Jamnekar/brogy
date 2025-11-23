import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { FilterPostDto } from './dto/filter-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepository: Repository<Post>,
  ) {}
  create(createPostDto: CreatePostDto) {
    const post = this.postRepository.create(createPostDto);

    return this.postRepository.save(post);
  }

  async findAll({
    title = '',
    from = '',
    to = '',
    published = '',
    page = 1,
    limit = 5,
    tags = [],
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
      query
        .andWhere('post.tags IS NOT NULL')
        .andWhere('post.tags && ARRAY[:...tags]', { tags });
    }

    const pageNo = page ?? 1;
    const limitNo = limit ?? 10;

    query.skip((pageNo - 1) * limitNo).take(limit);
    const [posts, total] = await query.getManyAndCount();
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
