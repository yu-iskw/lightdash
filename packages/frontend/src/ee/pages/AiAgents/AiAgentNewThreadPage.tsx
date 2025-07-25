import {
    ActionIcon,
    Center,
    Group,
    Pill,
    Popover,
    ScrollArea,
    Stack,
    Text,
    Title,
} from '@mantine-8/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useOutletContext, useParams } from 'react-router';
import { LightdashUserAvatar } from '../../../components/Avatar';
import MantineIcon from '../../../components/common/MantineIcon';
import { AgentChatInput } from '../../features/aiCopilot/components/ChatElements/AgentChatInput';
import { ChatElementsUtils } from '../../features/aiCopilot/components/ChatElements/utils';
import { useStartAgentThreadMutation } from '../../features/aiCopilot/hooks/useOrganizationAiAgents';
import { type AgentContext } from './AgentPage';

const AiAgentNewThreadPage = () => {
    const { agentUuid, projectUuid } = useParams();
    const { mutateAsync: startAgentThread, isLoading } =
        useStartAgentThreadMutation(agentUuid, projectUuid);
    const { agent } = useOutletContext<AgentContext>();

    return (
        <Center h="100%">
            <Stack
                justify="space-between"
                gap={0}
                pos="relative"
                {...ChatElementsUtils.centeredElementProps}
                h="unset"
            >
                <Stack flex={1} py="xl">
                    <Stack align="center" gap="xxs">
                        <LightdashUserAvatar
                            size="lg"
                            variant="filled"
                            name={agent.name || 'AI'}
                            src={agent.imageUrl}
                        />
                        <Group justify="center" gap={2}>
                            <Title order={4} ta="center">
                                {agent.name}
                            </Title>
                            {agent.instruction && (
                                <Popover withArrow>
                                    <Popover.Target>
                                        <ActionIcon
                                            variant="subtle"
                                            color="gray.6"
                                        >
                                            <MantineIcon
                                                icon={IconInfoCircle}
                                            />
                                        </ActionIcon>
                                    </Popover.Target>
                                    <Popover.Dropdown>
                                        <ScrollArea.Autosize
                                            type="hover"
                                            offsetScrollbars="y"
                                            scrollbars="y"
                                            mah={400}
                                        >
                                            <Text
                                                size="sm"
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {agent.instruction}
                                            </Text>
                                        </ScrollArea.Autosize>
                                    </Popover.Dropdown>
                                </Popover>
                            )}
                        </Group>
                        {agent.tags && (
                            <Group gap="xxs">
                                {agent.tags.map((tag, i) => (
                                    <Pill key={i} size="sm">
                                        {tag}
                                    </Pill>
                                ))}
                            </Group>
                        )}
                    </Stack>

                    <AgentChatInput
                        onSubmit={(prompt) => {
                            void startAgentThread({ prompt });
                        }}
                        loading={isLoading}
                        placeholder={`Ask ${agent.name} anything about your data...`}
                    />
                </Stack>
            </Stack>
        </Center>
    );
};
export default AiAgentNewThreadPage;
