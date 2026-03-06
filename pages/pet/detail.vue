<template>
	<view class="container">
		<!-- 头部背景与基本信息 -->
		<view v-if="pet" class="profile-header">
			<view class="header-content">
				<view class="avatar-box">
					<image :src="pet.avatar || '/static/default-pet.png'" mode="aspectFill" class="large-avatar"></image>
					<view class="gender-badge" :class="pet.gender">
						{{pet.gender === 'male' ? '♂' : '♀'}}
					</view>
				</view>
				<view class="main-info">
					<view class="name-row">
						<text class="pet-name-title">{{pet.name}}</text>
						<view class="type-pill">{{getPetTypeText(pet.type)}}</view>
					</view>
					<view class="meta-row">
						<view class="meta-item">🎂 {{calculateAge(pet.birthday)}}</view>
						<view class="meta-item">⚖️ {{pet.weight}}kg</view>
						<view class="meta-item" v-if="pet.breed">🧬 {{pet.breed}}</view>
					</view>
				</view>
				<view class="header-actions">
					<view class="delete-circle-btn" @tap="confirmDelete">×</view>
				</view>
			</view>
		</view>

		<!-- 选项卡切换 -->
		<view class="tab-scroller">
			<view class="tab-pill-container">
				<view class="pill-tab" :class="{active: activeTab === 0}" @tap="activeTab = 0">时光记录</view>
				<view class="pill-tab" :class="{active: activeTab === 1}" @tap="activeTab = 1">专属提醒</view>
			</view>
		</view>

		<!-- 时光记录板块 -->
		<view v-if="activeTab === 0" class="content-view">
			<view class="record-feed" v-if="records.length > 0">
				<view class="feed-item" v-for="record in records" :key="record.id" @tap="viewRecordDetail(record)">
					<view class="feed-sidebar">
						<view class="feed-icon-circle">{{getRecordIcon(record.type)}}</view>
						<view class="feed-line"></view>
					</view>
					<view class="feed-main">
						<view class="feed-header">
							<text class="feed-type-label">{{getRecordTypeName(record.type)}}</text>
							<text class="feed-time-label">{{formatDateTime(record.date)}}</text>
						</view>
						<view class="feed-body" v-if="record.remark || (record.images && record.images.length)">
							<text class="feed-text" v-if="record.remark">{{record.remark}}</text>
							<view class="feed-photos" v-if="record.images && record.images.length">
								<image v-for="(img, i) in record.images.slice(0, 3)" :key="i" :src="img" mode="aspectFill" class="feed-img"></image>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view class="empty-state-modern" v-else>
				<text class="empty-emoji">🎞️</text>
				<text class="empty-h1">还没有故事</text>
				<button class="add-mini-btn" @tap="addRecord">去记第一笔</button>
			</view>
		</view>

		<!-- 提醒板块 -->
		<view v-if="activeTab === 1" class="content-view">
			<view class="remind-grid" v-if="reminders.length > 0">
				<view class="remind-item-card" v-for="reminder in reminders" :key="reminder.id">
					<view class="remind-icon-box">{{getReminderIcon(reminder.type)}}</view>
					<view class="remind-body">
						<text class="remind-h">{{reminder.title}}</text>
						<text class="remind-d">📅 {{formatDate(reminder.targetDate)}}</text>
					</view>
					<view class="remind-st" :class="reminder.status">
						{{getReminderStatusText(reminder.status)}}
					</view>
				</view>
			</view>
			<view class="empty-state-modern" v-else>
				<text class="empty-emoji">⏰</text>
				<text class="empty-h1">一切都准时</text>
				<text class="empty-h2">暂无待办提醒</text>
			</view>
		</view>

		<!-- 悬浮操作按钮 -->
		<view class="floating-fab" @tap="addRecord">
			<text class="fab-plus">+</text>
		</view>
	</view>
</template>

<script>
	import { getPetById, getRecords, getReminders, deletePet } from '../../utils/api.js';
	import { getUserId } from '../../utils/user.js';

	export default {
		data() {
			return { petId: '', pet: null, activeTab: 0, records: [], reminders: [] }
		},
		onLoad(options) { this.petId = options.id; this.loadData(); },
		onShow() { this.loadData(); },
		methods: {
			async loadData() {
				const userId = await getUserId();
				const [p, r, m] = await Promise.all([
					getPetById(this.petId),
					getRecords({ petId: this.petId, userId }),
					getReminders({ petId: this.petId, userId })
				]);
				this.pet = p;
				this.records = (r || []).sort((a, b) => new Date(b.date) - new Date(a.date));
				this.reminders = (m || []).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
			},
			addRecord() { uni.navigateTo({ url: `/pages/record/add?petId=${this.petId}` }); },
			confirmDelete() {
				uni.showModal({
					title: '操作确认',
					content: '要告别这个小伙伴吗？相关记录也将消失...',
					confirmColor: '#FF5A5F',
					success: async (res) => {
						if (res.confirm) {
							await deletePet(this.petId);
							uni.showToast({ title: '已告别', icon: 'success' });
							setTimeout(() => uni.navigateBack(), 1200);
						}
					}
				});
			},
			viewRecordDetail(record) { uni.showModal({ title: this.getRecordTypeName(record.type), content: record.remark || '没有写下文字', showCancel: false }); },
			calculateAge(bd) {
				if (!bd) return '未知';
				const diff = Math.ceil((new Date() - new Date(bd)) / 86400000);
				return diff < 365 ? `${Math.floor(diff/30) || 1}个月` : `${Math.floor(diff/365)}岁`;
			},
			getPetTypeText(t) { return t || '小成员'; },
			getRecordIcon(t) {
				const i = { 'feed': '🍖', 'walk': '🚶', 'bath': '🛁', 'vaccine': '💉', 'medical': '🏥', 'weight': '⚖️' };
				return i[t] || '📦';
			},
			getRecordTypeName(t) {
				const n = { 'feed': '喂食', 'walk': '遛弯', 'bath': '洗澡', 'vaccine': '疫苗', 'medical': '就医', 'weight': '体重' };
				return n[t] || '记录';
			},
			getReminderIcon(t) { return this.getRecordIcon(t) || '⏰'; },
			getReminderStatusText(s) { return { 'pending': '待出发', 'reminded': '已过', 'completed': '搞定' }[s] || s; },
			formatDateTime(str) { return str.split(' ')[0]; },
			formatDate(str) {
				const d = new Date(str);
				return `${d.getMonth()+1}月${d.getDate()}日`;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: var(--bg-main);
		padding-bottom: 160rpx;
	}

	.profile-header {
		background: linear-gradient(180deg, var(--primary-light) 0%, var(--bg-main) 100%);
		padding: 80rpx 40rpx 40rpx;
	}

	.header-content {
		display: flex;
		align-items: center;
		position: relative;
	}

	.avatar-box {
		position: relative;
		margin-right: 32rpx;
	}

	.large-avatar {
		width: 180rpx;
		height: 180rpx;
		border-radius: var(--radius-full);
		border: 8rpx solid #FFF;
		box-shadow: var(--shadow-soft);
	}

	.gender-badge {
		position: absolute;
		bottom: 10rpx;
		right: 10rpx;
		width: 44rpx;
		height: 44rpx;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		color: #FFF;
		font-size: 24rpx;
		border: 4rpx solid #FFF;
	}
	.gender-badge.male { background-color: #4A90E2; }
	.gender-badge.female { background-color: #FF5A5F; }

	.main-info { flex: 1; }
	.pet-name-title { font-size: 52rpx; font-weight: 800; color: var(--text-main); margin-bottom: 12rpx; display: block; }
	
	.name-row { display: flex; align-items: center; gap: 16rpx; }
	.type-pill {
		background-color: var(--primary);
		color: var(--text-main);
		font-size: 20rpx;
		font-weight: 700;
		padding: 4rpx 16rpx;
		border-radius: var(--radius-full);
	}

	.meta-row { display: flex; gap: 20rpx; font-size: 24rpx; color: var(--text-muted); font-weight: 500; }

	.header-actions { position: absolute; top: -20rpx; right: 0; }
	.delete-circle-btn {
		width: 60rpx; height: 60rpx; background-color: #FFF;
		border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center;
		color: var(--text-muted); font-size: 40rpx; box-shadow: var(--shadow-soft);
	}

	.tab-scroller { margin: 20rpx 0; padding: 0 40rpx; }
	.tab-pill-container {
		background-color: #EFE6D5;
		height: 90rpx;
		border-radius: var(--radius-full);
		display: flex;
		padding: 10rpx;
	}

	.pill-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 700;
		color: var(--text-muted);
		border-radius: var(--radius-full);
		transition: all 0.3s;
	}

	.pill-tab.active { background-color: #FFF; color: var(--text-main); box-shadow: var(--shadow-soft); }

	.content-view { padding: 40rpx; }

	.record-feed { display: flex; flex-direction: column; }
	.feed-item { display: flex; margin-bottom: 40rpx; }
	.feed-sidebar { display: flex; flex-direction: column; align-items: center; margin-right: 24rpx; }
	.feed-icon-circle {
		width: 72rpx; height: 72rpx; background-color: #FFF; border-radius: var(--radius-full);
		display: flex; align-items: center; justify-content: center; font-size: 36rpx;
		box-shadow: var(--shadow-soft); z-index: 2;
	}
	.feed-line { flex: 1; width: 4rpx; background-color: #EFE6D5; margin-top: 10rpx; }

	.feed-main {
		flex: 1; background-color: #FFF; border-radius: var(--radius-md);
		padding: 24rpx; box-shadow: var(--shadow-soft);
	}
	.feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
	.feed-type-label { font-size: 28rpx; font-weight: 800; color: var(--text-main); }
	.feed-time-label { font-size: 22rpx; color: var(--text-muted); }
	
	.feed-text { font-size: 26rpx; color: var(--text-muted); line-height: 1.6; display: block; margin-bottom: 16rpx; }
	.feed-photos { display: flex; gap: 12rpx; }
	.feed-img { width: 110rpx; height: 110rpx; border-radius: var(--radius-sm); }

	.remind-grid { display: grid; gap: 24rpx; }
	.remind-item-card {
		background-color: #FFF; border-radius: var(--radius-md); padding: 24rpx;
		display: flex; align-items: center; box-shadow: var(--shadow-soft);
	}
	.remind-icon-box { font-size: 44rpx; margin-right: 24rpx; }
	.remind-body { flex: 1; }
	.remind-h { font-size: 28rpx; font-weight: 800; color: var(--text-main); display: block; }
	.remind-d { font-size: 22rpx; color: var(--secondary); font-weight: 600; }
	.remind-st { font-size: 20rpx; font-weight: 700; padding: 6rpx 16rpx; border-radius: var(--radius-full); }
	.remind-st.pending { background-color: var(--primary-light); color: var(--primary); }

	.empty-state-modern {
		padding: 100rpx 40rpx; text-align: center;
		display: flex; flex-direction: column; align-items: center;
	}
	.empty-emoji { font-size: 100rpx; margin-bottom: 24rpx; }
	.empty-h1 { font-size: 32rpx; font-weight: 800; color: var(--text-main); margin-bottom: 40rpx; }
	.add-mini-btn {
		background-color: var(--primary); padding: 16rpx 48rpx;
		border-radius: var(--radius-full); font-size: 26rpx; font-weight: 700; border: none;
	}

	.floating-fab {
		position: fixed; bottom: 60rpx; right: 60rpx;
		width: 120rpx; height: 120rpx; background-color: var(--primary);
		border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center;
		box-shadow: 0 12rpx 24rpx rgba(255, 182, 41, 0.4); z-index: 1000;
	}
	.fab-plus { font-size: 60rpx; color: var(--text-main); font-weight: 800; }
</style>
