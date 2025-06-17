# app/models/user.rb
class User < ApplicationRecord
  has_secure_password

  belongs_to :role
  has_many :products, foreign_key: :seller_id
  has_many :buyer_requests, foreign_key: :buyer_id
end
