export const SITE_NAME = '青嵐のあとで'
export const SITE_SUBTITLE = '随笔、思考与记录'
export const SITE_TIME_ZONE = 'Asia/Shanghai'

export const AUTHOR_PROFILE = {
  name: 'Sanwoo',
  handle: '@sanwoo',
  title: 'A full-stack developer',
  bio: '关于工作、生活和世界的随笔、思考与记录。',
  poem: '云无心以出岫，鸟倦飞而知还。',
  email: 'sanwoo1277255458@gmail.com',
  telegram: 'https://t.me/KiyamaHarumiX',
  github: 'https://github.com/Sanwoo',
}

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

export function absoluteUrl(path = '/') {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
