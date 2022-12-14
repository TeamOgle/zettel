import { TagEntity } from '../../database/entities/tags.entity';
import { LinkEntity } from '../../database/entities/links.entity';
import type {
  ModalView,
  Block,
  KnownBlock,
  MessageAttachment,
  PlainTextOption,
} from '@slack/web-api';
import { DateTime } from 'luxon';
import type { BlockActionView } from '../interfaces';
import * as short from 'short-uuid';

export const USER_ACTION_ID = 'selected_users';
export const USER_OPTION_ACTION_ID = 'user_option';
export const TAG_ACTION_ID = 'selected_options';
export const LINK_ACTION_ID = 'link';
export const CONTENT_ACTION_ID = 'contents';

export function slackModalView(tags: TagEntity[]): ModalView {
  const tagOptions: PlainTextOption[] = tags.map((tag) => ({
    text: {
      type: 'plain_text',
      text: tag.name,
      emoji: true,
    },
    value: tag.id,
  }));

  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Zettel',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: '제텔로 공유하기',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: '닫기',
    },
    callback_id: 'call_modal',
    blocks: [
      {
        type: 'input',
        element: {
          type: 'radio_buttons',
          options: [
            {
              text: {
                type: 'plain_text',
                text: '개별 공유하기',
                emoji: true,
              },
              value: 'selected_users',
            },
            {
              text: {
                type: 'plain_text',
                text: '채널 멤버 전체에게 공유하기',
                emoji: true,
              },
              value: 'selected_all',
            },
          ],
          action_id: USER_OPTION_ACTION_ID,
          initial_option: {
            text: {
              type: 'plain_text',
              text: '개별 공유하기',
              emoji: true,
            },
            value: 'selected_users',
          },
        },
        label: {
          type: 'plain_text',
          text: ' ',
          emoji: true,
        },
        dispatch_action: true,
      },
      {
        type: 'input',
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: '누구와 정보를 공유 할까요?',
            emoji: true,
          },
          action_id: USER_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: ' ',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: '태그로 정보를 분류해 보세요',
            emoji: true,
          },
          options: tagOptions,
          action_id: TAG_ACTION_ID,
        },
        label: {
          type: 'plain_text',
          text: ' ',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: LINK_ACTION_ID,
          placeholder: {
            type: 'plain_text',
            text: '공유할 링크를 입력해 주세요',
            emoji: true,
          },
        },
        label: {
          type: 'plain_text',
          text: ' ',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          multiline: true,
          action_id: CONTENT_ACTION_ID,
          placeholder: {
            type: 'plain_text',
            text: '생각을 공유하고 팀원들과 이야기 나눠보세요!',
            emoji: true,
          },
        },
        label: {
          type: 'plain_text',
          text: '공유하고 싶은 이유는 무엇인가요?',
          emoji: true,
        },
      },
    ],
  };
}

export function slackUpdatedModalView(prevView: BlockActionView, isToAllUsers: boolean): ModalView {
  const blocks = prevView.blocks;
  if (isToAllUsers) {
    blocks.splice(1, 1);
  } else {
    const userSelect: Block | KnownBlock = {
      type: 'input',
      element: {
        type: 'multi_users_select',
        placeholder: {
          type: 'plain_text',
          text: '누구와 정보를 공유 할까요?',
          emoji: true,
        },
        action_id: USER_ACTION_ID,
      },
      label: {
        type: 'plain_text',
        text: ' ',
        emoji: true,
      },
    };
    blocks.splice(1, 0, userSelect);
  }

  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Zettel',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: '제텔로 공유하기',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: '닫기',
    },
    callback_id: 'call_modal',
    blocks,
  };
}

export function slackModalMessage(
  linkId: string,
  receiverMentions: string,
  userId: string,
  tags: string,
  content: string,
  url: string,
  title?: string,
) {
  const translator = short();
  const shortId = translator.fromUUID(linkId);

  const messageBlocks: (Block | KnownBlock)[] = [
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `ID: *${shortId}*`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${receiverMentions} 이거 같이 볼까요? 👀*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${userId}>님이 공유했어요`,
      },
    },
  ];

  const messageAttachments: MessageAttachment[] = [
    {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${tags}`,
          },
        },
      ],
      color: '#355FE9',
    },
    {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${content} \n\n*<${url}|👉 ${title ?? '지금 보러가기'}>*`,
          },
        },
      ],
      color: '#01319F',
    },
  ];
  return { messageBlocks, messageAttachments };
}

export function slackSharingLinkMessage(links: LinkEntity[], userCount: number) {
  const messageBlocks: (Block | KnownBlock)[] = links.reduce((prev, link) => {
    const translator = short();
    const shortId = translator.fromUUID(link.id);
    const createdAt = DateTime.fromJSDate(link.createdAt).toFormat('📘 yy년 MM월 dd일');
    const sharedUsers =
      link.sharedUsers.length === userCount
        ? '모두'
        : `${link.sharedUsers.map((user) => `<@${user.slackUserId}>`).join(' ')}님`;
    const content = link.content.slice(0, 80);
    return [
      ...prev,
      ...slackLinkMessage(shortId, createdAt, `${sharedUsers}에게 공유했어요`, content, link.url),
    ];
  }, []);
  return slackLinkBlocks(messageBlocks, '공유한 링크가 없습니다');
}

export function slackSharedLinkMessage(links: LinkEntity[]) {
  const messageBlocks: (Block | KnownBlock)[] = links.reduce((prev, link) => {
    const translator = short();
    const shortId = translator.fromUUID(link.id);
    const createdAt = DateTime.fromJSDate(link.createdAt).toFormat('📙 yy년 MM월 dd일');
    const sharingUser = `<@${link.sharingUser.slackUserId}>님이 공유했어요`;
    const content = link.content.slice(0, 80);
    return [...prev, ...slackLinkMessage(shortId, createdAt, sharingUser, content, link.url)];
  }, []);
  return slackLinkBlocks(messageBlocks, '공유받은 링크가 없습니다');
}

function slackLinkMessage(
  linkId: string,
  createdAt: string,
  userMessage: string,
  content: string,
  url: string,
  title?: string,
) {
  return [
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `ID: *${linkId}*`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${createdAt}에 ${userMessage}*\n${content}${
          content.length === 80 ? '...' : ''
        }\n*<${url}|${title ?? '지금 보러가기'}>*\n\n`,
      },
    },
    {
      type: 'divider',
    },
  ];
}

function slackLinkBlocks(messageBlocks: (Block | KnownBlock)[], emptyMessage: string) {
  return {
    blocks: messageBlocks.length
      ? messageBlocks
      : [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emptyMessage}\n\n`,
            },
          },
        ],
  };
}
