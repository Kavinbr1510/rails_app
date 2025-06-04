class User < ApplicationRecord
include Clearance::User

belongs_to :role
has_many :products, foreign_key: :seller_id
has_many :buyer_requests, foreign_key: :buyer_id
end
