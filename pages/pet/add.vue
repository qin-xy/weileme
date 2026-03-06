<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="nav-back" @tap="goBack">
				<text class="back-icon">‹</text>
			</view>
			<text class="nav-title">添加宠物</text>
			<view class="nav-placeholder"></view>
		</view>

		<view class="form-card">
			<!-- 头像选择 -->
			<view class="avatar-section">
				<view class="avatar-wrapper" @tap="chooseAvatar">
					<image v-if="avatar" :src="avatar" mode="aspectFill" class="avatar-image"></image>
					<view v-else class="avatar-placeholder">
					<view class="placeholder-icon-wrap">
						<text class="placeholder-icon">🐶</text>
					</view>
						<text class="placeholder-text">点击上传头像</text>
					</view>
					<view class="avatar-edit">
						<text class="edit-icon">📷</text>
					</view>
				</view>
			</view>

			<!-- 基本信息 -->
			<view class="form-section">
				<view class="section-header">
					<view class="section-line"></view>
					<text class="section-title">基本信息</text>
				</view>

				<view class="form-item">
					<view class="label">宠物名字 <text class="required">*</text></view>
					<input class="input" v-model="pet.name" placeholder="请输入宠物名字" placeholder-class="placeholder" />
				</view>

				<view class="form-item">
					<view class="label">宠物类型 <text class="required">*</text></view>
					<view class="type-selector">
						<view class="type-option" 
							  v-for="(type, index) in petTypeList" 
							  :key="index"
							  :class="{active: petTypeIndex === index}"
							  @tap="selectPetType(index)">
							<text class="type-icon">{{type.icon}}</text>
							<text class="type-name">{{type.name}}</text>
						</view>
					</view>
				</view>

				<view class="form-item">
					<view class="label">品种</view>
					<input class="input" v-model="pet.breed" placeholder="例如：金毛、英短等" placeholder-class="placeholder" />
				</view>

				<view class="form-row">
					<view class="form-item half">
						<view class="label">性别</view>
						<view class="gender-group">
							<view class="gender-item" :class="{active: pet.gender === 'male'}" @tap="pet.gender = 'male'">
								<text class="gender-icon">♂</text>
								<text class="gender-text">公</text>
							</view>
							<view class="gender-item" :class="{active: pet.gender === 'female'}" @tap="pet.gender = 'female'">
								<text class="gender-icon">♀</text>
								<text class="gender-text">母</text>
							</view>
						</view>
					</view>

					<view class="form-item half">
						<view class="label">体重（kg）</view>
						<input class="input" v-model="pet.weight" type="digit" placeholder="0.0" placeholder-class="placeholder" />
					</view>
				</view>

				<view class="form-item">
					<view class="label">生日</view>
					<picker mode="date" :value="pet.birthday" @change="onBirthdayChange" class="picker">
						<view class="picker-input" :class="{placeholder: !pet.birthday}">
							<text class="picker-text">{{pet.birthday || '请选择生日'}}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>

			<!-- 提交按钮 -->
			<view class="submit-section">
				<button class="submit-btn" @tap="savePet">保存宠物</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { createPet, uploadImage } from '../../utils/api.js';
	import { BASE_URL } from '../../utils/config.js';
	import { getUserId } from '../../utils/user.js';

	export default {
		data() {
			return {
				pet: {
					name: '',
					type: '',
					breed: '',
					gender: '',
					birthday: '',
					weight: '',
					avatar: ''
				},
				petTypeList: [
				{ name: '狗狗', icon: '🐕', value: 'dog' },
				{ name: '猫咪', icon: '🐱', value: 'cat' },
				{ name: '鸟类', icon: '🐦', value: 'bird' },
				{ name: '其他', icon: '🐶', value: 'other' }
			],
				petTypeIndex: -1,
				avatar: ''
			}
		},
		methods: {
			goBack() {
				uni.navigateBack();
			},

			selectPetType(index) {
				this.petTypeIndex = index;
				this.pet.type = this.petTypeList[index].value;
			},

			onBirthdayChange(e) {
				this.pet.birthday = e.detail.value;
			},

			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						this.avatar = res.tempFilePaths[0];
						this.pet.avatar = res.tempFilePaths[0];
					}
				});
			},

			async savePet() {
				if (!this.pet.name.trim()) {
					uni.showToast({ title: '请输入宠物名字', icon: 'none' });
					return;
				}

				if (!this.pet.type) {
					uni.showToast({ title: '请选择宠物类型', icon: 'none' });
					return;
				}

				try {
					uni.showLoading({ title: '保存中...' });
					const userId = await getUserId();
					const avatar = await this.uploadAvatar(this.avatar);

					await createPet({
						userId,
						name: this.pet.name.trim(),
						type: this.pet.type,
						breed: this.pet.breed.trim(),
						gender: this.pet.gender,
						birthday: this.pet.birthday,
						weight: this.pet.weight,
						avatar
					});

					uni.hideLoading();
					uni.showToast({
						title: '保存成功',
						icon: 'success',
						success: () => {
							setTimeout(() => {
								uni.navigateBack();
							}, 1500);
						}
					});
				} catch (error) {
					uni.hideLoading();
					uni.showToast({ title: error.message || '保存失败', icon: 'none' });
				}
			},

			async uploadAvatar(avatarPath) {
				if (!avatarPath) return '';
				if (/^https?:\/\//.test(avatarPath)) return avatarPath;
				const result = await uploadImage(avatarPath);
				if (result.url) return `${BASE_URL}${result.url}`;
				return result.path || avatarPath;
			}
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #FAF7F2 0%, #F5F0E8 100%);
	}

	/* 导航栏 */
	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 100rpx 32rpx 24rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
	}

	.nav-back {
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.back-icon {
		font-size: 48rpx;
		color: #FFFFFF;
		font-weight: 300;
	}

	.nav-title {
		font-size: 34rpx;
		font-weight: 600;
		color: #FFFFFF;
	}

	.nav-placeholder {
		width: 64rpx;
	}

	/* 表单卡片 */
	.form-card {
		background: #FFFFFF;
		border-radius: 36rpx 36rpx 0 0;
		padding: 48rpx 32rpx;
		margin-top: -20rpx;
		min-height: calc(100vh - 188rpx);
	}

	/* 头像部分 */
	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 48rpx;
	}

	.avatar-wrapper {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		border-radius: 50%;
		overflow: hidden;
		border: 6rpx solid #F5F0E8;
		box-shadow: 0 8rpx 32rpx rgba(196, 167, 125, 0.25);
	}

	.avatar-image {
		width: 100%;
		height: 100%;
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #F4E4D6 0%, #E8D5C4 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon-wrap {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16rpx;
	}

	.placeholder-icon {
		font-size: 56rpx;
	}

	.placeholder-text {
		font-size: 24rpx;
		color: #9B8B7A;
	}

	.avatar-edit {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 56rpx;
		height: 56rpx;
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4rpx solid #FFFFFF;
	}

	.edit-icon {
		font-size: 28rpx;
	}

	/* 表单部分 */
	.form-section {
		margin-bottom: 48rpx;
	}

	.section-header {
		display: flex;
		align-items: center;
		margin-bottom: 32rpx;
	}

	.section-line {
		width: 6rpx;
		height: 32rpx;
		background: linear-gradient(180deg, #C4A77D 0%, #A68B5B 100%);
		border-radius: 3rpx;
		margin-right: 16rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #3D3229;
	}

	.form-item {
		margin-bottom: 32rpx;
	}

	.form-row {
		display: flex;
		gap: 24rpx;
	}

	.form-item.half {
		flex: 1;
		margin-bottom: 0;
	}

	.label {
		font-size: 28rpx;
		font-weight: 600;
		color: #3D3229;
		margin-bottom: 16rpx;
	}

	.required {
		color: #C4786E;
		margin-left: 4rpx;
	}

	.input {
		background: #F5F0E8;
		padding: 24rpx 28rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		color: #3D3229;
		height: 88rpx;
		line-height: 88rpx;
		box-sizing: border-box;
	}

	.placeholder {
		color: #B8A99A;
	}

	/* 类型选择器 */
	.type-selector {
		display: flex;
		gap: 16rpx;
	}

	.type-option {
		flex: 1;
		background: #F5F0E8;
		border-radius: 20rpx;
		padding: 24rpx 16rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: all 0.2s ease;
		border: 2rpx solid transparent;
	}

	.type-option.active {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		border-color: #C4A77D;
	}

	.type-icon {
		font-size: 44rpx;
		margin-bottom: 8rpx;
	}

	.type-name {
		font-size: 22rpx;
		color: #6B5D4D;
		font-weight: 500;
	}

	.type-option.active .type-name {
		color: #FFFFFF;
	}

	/* 性别选择 */
	.gender-group {
		display: flex;
		gap: 16rpx;
	}

	.gender-item {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F5F0E8;
		padding: 20rpx;
		border-radius: 16rpx;
		transition: all 0.2s ease;
	}

	.gender-item.active {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
	}

	.gender-icon {
		font-size: 32rpx;
		margin-right: 8rpx;
	}

	.gender-text {
		font-size: 26rpx;
		font-weight: 600;
		color: #6B5D4D;
	}

	.gender-item.active .gender-icon,
	.gender-item.active .gender-text {
		color: #FFFFFF;
	}

	/* 选择器 */
	.picker {
		width: 100%;
	}

	.picker-input {
		background: #F5F0E8;
		padding: 24rpx 28rpx;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.picker-text {
		font-size: 28rpx;
		color: #3D3229;
	}

	.picker-input.placeholder .picker-text {
		color: #B8A99A;
	}

	.picker-arrow {
		font-size: 32rpx;
		color: #B8A99A;
	}

	/* 提交按钮 */
	.submit-section {
		margin-top: 48rpx;
		padding-bottom: 48rpx;
	}

	.submit-btn {
		background: linear-gradient(135deg, #C4A77D 0%, #A68B5B 100%);
		color: #FFFFFF;
		font-weight: 600;
		border-radius: 50rpx;
		font-size: 32rpx;
		border: none;
		box-shadow: 0 8rpx 24rpx rgba(196, 167, 125, 0.35);
		height: 96rpx;
		line-height: 96rpx;
	}

	.submit-btn:active {
		opacity: 0.95;
		transform: scale(0.98);
	}
</style>
