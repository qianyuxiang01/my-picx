<template>
	<div
		class="w-full bg-rose-100 rounded-md shadow-sm overflow-hidden relative"
		v-if="!imageError"
	>
		<loading-overlay :loading="loading" />

		<el-image
			ref="imageRef"
			class="block w-full h-40 lg:h-60"
			:src="src"
			fit="cover"
			hide-on-click-modal
			lazy
			@error="imageError = true"
			@load="loading = false"
			:preview-src-list="previewList"
			:initial-index="currentIndex"
			@click="handleImageClick"
		/>
		<div class="w-full absolute left-0 bottom-0 bg-slate-800/70 backdrop-blur-sm">
			<!-- <div class="p-2">
				<div class="w-full flex items-center text-white">
					<div class="flex-1 w-full truncate">
						<el-tooltip :content="name" placement="top-start">
							{{ name }}
						</el-tooltip>
					</div>
					<div
						v-if="mode === 'converted'"
						class="w-6 h-6 flex items-center justify-center cursor-pointer"
						@click="emit('delete')"
					>
						<font-awesome-icon :icon="faTimesCircle" />
					</div>
				</div>
				<span class="text-xs text-gray-300 flex items-center">
					{{ formatBytes(size) }}
					<el-divider v-if="uploadedAt" direction="vertical" />
					<span v-if="uploadedAt">
						{{ new Date(uploadedAt).toLocaleDateString() }}
					</span>
				</span>
			</div> -->
			<div v-if="mode === 'uploaded'">
				<el-divider class="m-0" />
				<div class="w-full flex text-white h-9 text-center text-sm">
					<el-tooltip :content="src" placement="top-start">
						<div
							class="flex-1 flex items-center justify-center cursor-pointer"
							@click="copyLink(src)"
						>
							<font-awesome-icon :icon="faCopy" class="mr-2" />
							链接{{ name }}
						</div>
					</el-tooltip>
					<!-- <el-divider direction="vertical" class="h-full" />
					<el-popconfirm
						title="确认删除图片吗？"
						confirm-button-type="danger"
						@confirm="
							() => {
								// (e: Event) => boolean ???
								loading = true
								emit('delete')
								return true
							}
						"
					>
						<template #reference>
							<div class="flex-1 flex items-center justify-center cursor-pointer">
								<font-awesome-icon :icon="faTrashAlt" class="mr-2" />
								删除
							</div>
						</template>
					</el-popconfirm> -->
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { faTimesCircle, faTrashAlt, faCopy } from '@fortawesome/free-regular-svg-icons'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import copy from 'copy-to-clipboard'
import formatBytes from '../utils/format-bytes'
import {ElTooltip, ElDivider, ElPopconfirm, ElImage, ElMessage} from 'element-plus'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LoadingOverlay from '../components/LoadingOverlay.vue'

const props = defineProps<{
	src: string
	name: string
	size: number
	mode: 'converted' | 'uploaded'
	uploadedAt?: number
	expiresAt?: number
	imageList?: string[]
	index?: number
}>()
const emit = defineEmits(['delete', 'navigate'])

const imageError = ref(false)
const loading = ref(true)
const imageRef = ref()
const isPreviewMode = ref(false)
const previewObserver = ref<MutationObserver | null>(null)

const currentIndex = computed(() => props.index ?? 0)
const previewList = computed(() => props.imageList ?? [props.src])
const isFirstImage = computed(() => currentIndex.value === 0)
const isLastImage = computed(() => currentIndex.value === previewList.value.length - 1)

const playBeep = () => {
	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
	const oscillator = audioContext.createOscillator()
	const gainNode = audioContext.createGain()
	
	oscillator.connect(gainNode)
	gainNode.connect(audioContext.destination)
	
	oscillator.frequency.value = 800
	oscillator.type = 'sine'
	
	gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
	gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
	
	oscillator.start(audioContext.currentTime)
	oscillator.stop(audioContext.currentTime + 0.1)
}

const navigatePrevious = () => {
	if (isFirstImage.value) {
		playBeep()
		return
	}
	emit('navigate', currentIndex.value - 1)
}

const navigateNext = () => {
	if (isLastImage.value) {
		playBeep()
		return
	}
	emit('navigate', currentIndex.value + 1)
}

const handleKeydown = (event: KeyboardEvent) => {
	if (!isPreviewMode.value) return
	
	if (event.key === 'ArrowLeft') {
		event.preventDefault()
		navigatePrevious()
	} else if (event.key === 'ArrowRight') {
		event.preventDefault()
		navigateNext()
	}
}

const handleImageClick = () => {
	isPreviewMode.value = true
	setTimeout(() => {
		setupPreviewNavigation()
	}, 100)
}

const setupPreviewNavigation = () => {
	const previewContainer = document.querySelector('.el-image-viewer__wrapper')
	if (!previewContainer) return
	
	const existingNav = previewContainer.querySelector('.custom-image-nav')
	if (existingNav) return
	
	const navContainer = document.createElement('div')
	navContainer.className = 'custom-image-nav'
	navContainer.style.cssText = 'position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; pointer-events: none; z-index: 2000;'
	
	const leftButton = document.createElement('button')
	leftButton.innerHTML = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-left" class="svg-inline--fa fa-chevron-left text-xl" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"></path></svg>'
	leftButton.style.cssText = 'pointer-events: auto; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.3); color: white; border-radius: 9999px; margin: 0.5rem; transition: all 0.3s; border: none; cursor: pointer;'
	leftButton.onmouseover = () => leftButton.style.backgroundColor = 'rgba(0,0,0,0.5)'
	leftButton.onmouseout = () => leftButton.style.backgroundColor = 'rgba(0,0,0,0.3)'
	leftButton.onclick = (e) => {
		e.stopPropagation()
		navigatePrevious()
	}
	
	const rightButton = document.createElement('button')
	rightButton.innerHTML = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-right" class="svg-inline--fa fa-chevron-right text-xl" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"></path></svg>'
	rightButton.style.cssText = 'pointer-events: auto; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.3); color: white; border-radius: 9999px; margin: 0.5rem; transition: all 0.3s; border: none; cursor: pointer;'
	rightButton.onmouseover = () => rightButton.style.backgroundColor = 'rgba(0,0,0,0.5)'
	rightButton.onmouseout = () => rightButton.style.backgroundColor = 'rgba(0,0,0,0.3)'
	rightButton.onclick = (e) => {
		e.stopPropagation()
		navigateNext()
	}
	
	const updateButtonStates = () => {
		if (isFirstImage.value) {
			leftButton.disabled = true
			leftButton.style.opacity = '0.3'
			leftButton.style.cursor = 'not-allowed'
		} else {
			leftButton.disabled = false
			leftButton.style.opacity = '1'
			leftButton.style.cursor = 'pointer'
		}
		
		if (isLastImage.value) {
			rightButton.disabled = true
			rightButton.style.opacity = '0.3'
			rightButton.style.cursor = 'not-allowed'
		} else {
			rightButton.disabled = false
			rightButton.style.opacity = '1'
			rightButton.style.cursor = 'pointer'
		}
	}
	
	updateButtonStates()
	
	navContainer.appendChild(leftButton)
	navContainer.appendChild(rightButton)
	previewContainer.appendChild(navContainer)
	
	document.addEventListener('keydown', handleKeydown)
	
	const observer = new MutationObserver((mutations) => {
		const viewerExists = document.querySelector('.el-image-viewer__wrapper')
		if (!viewerExists) {
			isPreviewMode.value = false
			document.removeEventListener('keydown', handleKeydown)
			observer.disconnect()
		} else {
			updateButtonStates()
		}
	})
	
	observer.observe(document.body, { childList: true, subtree: true })
	previewObserver.value = observer
}

const copyLink = (link : string) => {
  const res = copy(link)
  if (res) {
    ElMessage.success('链接复制成功')
  } else {
    ElMessage.success('链接复制失败')
  }
}

onMounted(() => {
})

onUnmounted(() => {
	if (previewObserver.value) {
		previewObserver.value.disconnect()
	}
	document.removeEventListener('keydown', handleKeydown)
})
</script>
